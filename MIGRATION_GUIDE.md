# Mighty Flights — Migration Guide
## Vercel + Supabase → Google Cloud Stack

**Target stack:**
- **Hosting:** Cloud Run (direct, not Firebase App Hosting — cheaper free tier)
- **Database:** Firestore (NoSQL, flat collections only)
- **Auth:** Firebase Auth (with custom claims for roles)
- **Real-time:** Firestore listeners (built-in, no extra service)

**Why this stack:** zero-cost target. Cloud Run's always-free tier (2M requests/month) is more generous than App Hosting. Firestore free tier gives 50K reads/day. Firebase Auth is free up to 50K MAU.

---

## Table of Contents

1. [Pre-Migration: Clone Repo](#1-pre-migration-clone-repo)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Firestore Schema Design](#3-firestore-schema-design)
4. [Firebase Project Setup](#4-firebase-project-setup)
5. [Data Migration Script](#5-data-migration-script)
6. [Security Rules](#6-security-rules)
7. [Composite Indexes](#7-composite-indexes)
8. [Auth Migration (NextAuth → Firebase Auth)](#8-auth-migration-nextauth--firebase-auth)
9. [Database Layer (Drizzle → Firestore Admin SDK)](#9-database-layer-drizzle--firestore-admin-sdk)
10. [Real-Time Event Management](#10-real-time-event-management)
11. [Cloud Run Deployment](#11-cloud-run-deployment)
12. [Custom Domain Setup](#12-custom-domain-setup)
13. [Cost Controls](#13-cost-controls)
14. [Rollback Plan](#14-rollback-plan)

---

## 1. Pre-Migration: Clone Repo

Keep the original Vercel/Supabase app running. Work on a new copy.

```bash
# Clone existing repo into new folder
git clone https://github.com/YOUR_USERNAME/mighty-flights.git mighty-flights-google
cd mighty-flights-google

# Detach from original remote
git remote remove origin

# Create new repo on GitHub:
#   https://github.com/new → name: mighty-flights-google → Private
#   DO NOT initialize with README/gitignore/license

# Link to new remote
git remote add origin https://github.com/YOUR_USERNAME/mighty-flights-google.git
git branch -M master
git push -u origin master

# Verify
git remote -v
```

**Result:** Original repo untouched and still auto-deploying to Vercel. New repo ready for Google-stack changes.

---

## 2. Architecture Decisions

### Why flat collections, no sub-collections

Firestore charges per document read. A sub-collection like `/clubs/{id}/leagueNights/{id}/rounds/{id}` requires multiple reads to traverse, and collection-group queries cost more to index. Flat collections with cross-reference IDs (e.g. `leagueNights.clubId`) give us:

- Single composite index per query
- Cheaper reads (one collection scan, not nested traversal)
- Simpler security rules
- Easier cross-club queries when needed

### Deterministic IDs

For collections where duplicates must be prevented, we use computed IDs instead of random UUIDs:

| Collection | ID Pattern | Reason |
|---|---|---|
| `users` | Firebase Auth UID | Auth-to-DB link without lookup |
| `rsvps` | `{leagueNightId}_{userId}` | Prevents double RSVP |
| `pairStats` | `{sortedPlayerA}_{sortedPlayerB}` | Same pair regardless of order |
| `matchupHistory` | existing `matchupKey` | Already unique in your schema |

### Timer separation

Players should NOT see the round timer (your requirement). Two strategies considered:

- **Option A:** Hide timer in UI only → ❌ leaks via DevTools
- **Option B:** Separate `leagueNightTimers` collection with strict rules → ✅ enforced at DB level

We use Option B. Players literally cannot read timer docs.

### Denormalization

Store derived/lookup values inline to avoid extra reads:
- `fixtures.teamA` already contains `playerIds` array (no join needed)
- `leagueNights.attendingPlayerIds` array for quick membership checks
- Consider adding `playerName` to fixtures if frequently displayed

---

## 3. Firestore Schema Design

### Collection Map

```
/clubs/{clubId}
/users/{userId}                       ← userId = Firebase Auth UID
/players/{playerId}
/inviteTokens/{tokenId}
/handicapSettings/{settingId}
/leagueNights/{nightId}               ← public event data
/leagueNightTimers/{nightId}          ← host + super_admin only
/rsvps/{leagueNightId_userId}         ← deterministic ID
/rounds/{roundId}
/fixtures/{fixtureId}
/pairStats/{sortedPlayerA_sortedPlayerB}
/matchupHistory/{matchupKey}
/contactMessages/{messageId}
/registrationRequests/{requestId}
```

### Document Shapes (key fields)

**`/users/{uid}`**
```ts
{
  email: string,
  name: string,
  role: 'super_admin' | 'club_manager' | 'host' | 'player',
  clubId: string | null,
  playerId: string | null,
  mustResetPassword: boolean,
  createdAt: Timestamp
  // NOTE: passwordHash removed — Firebase Auth holds it
}
```

**`/leagueNights/{nightId}`** (public)
```ts
{
  clubId: string,
  date: Timestamp,
  attendingPlayerIds: string[],
  boardCount: number,
  status: 'setup' | 'in_progress' | 'completed',
  rsvpDeadline: Timestamp | null,
  rsvpToken: string | null,
  hostUserId: string,
  createdAt: Timestamp
}
```

**`/leagueNightTimers/{nightId}`** (host + super_admin only)
```ts
{
  hostUserId: string,
  timerEndsAt: Timestamp | null,
  timerDurationSec: number,
  timerPausedAt: Timestamp | null,
  isRunning: boolean
}
```

All other collections map 1:1 from Drizzle schema. See migration script for exact field mappings.

---

## 4. Firebase Project Setup

```bash
# 1. Create Firebase project at console.firebase.google.com
#    Project name: mighty-flights (or whatever)
#    Disable Google Analytics (optional, reduces noise)

# 2. Upgrade to Blaze plan (REQUIRED — card needed even for free usage)
#    Firebase Console → Settings → Usage and billing → Modify plan

# 3. Enable services
#    Build → Authentication → Get Started → Email/Password (enable)
#    Build → Firestore Database → Create Database → Production mode → us-central1

# 4. Install Firebase CLI locally
npm install -g firebase-tools
firebase login
firebase init
#    Select: Firestore, Hosting (skip), Functions (skip)
#    Use existing project → mighty-flights
#    firestore.rules → keep default name
#    firestore.indexes.json → keep default name

# 5. Get service account for migration script
#    Firebase Console → Project Settings → Service Accounts → Generate New Private Key
#    Save as firebase-service-account.json (gitignore this!)
```

Add to `.gitignore`:
```
firebase-service-account.json
.env.local
.env
```

---

## 5. Data Migration Script

One-shot script that copies Supabase Postgres → Firestore + imports users to Firebase Auth.

### Install dependencies

```bash
npm install firebase-admin postgres dotenv
npm install -D tsx
```

### Environment variables (`.env`)

```bash
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Script: `migrate-to-firestore.ts`

```ts
import postgres from "postgres";
import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import "dotenv/config";

const serviceAccount = JSON.parse(
  readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH!, "utf-8")
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require" });
const BATCH = 400;

async function bulkWrite<T extends { id: string }>(
  collection: string,
  rows: T[],
  transform: (r: T) => Record<string, any>,
  idFn?: (r: T) => string
) {
  console.log(`→ ${collection}: ${rows.length} docs`);
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = db.batch();
    rows.slice(i, i + BATCH).forEach((row) => {
      const id = idFn ? idFn(row) : row.id;
      batch.set(db.collection(collection).doc(id), transform(row));
    });
    await batch.commit();
  }
}

const pairId = (a: string, b: string) => [a, b].sort().join("_");

// ── Migrations (one function per table) ─────────────────────────────────

async function migrateClubs() {
  const rows = await sql`SELECT * FROM clubs`;
  await bulkWrite("clubs", rows as any[], (r) => ({
    name: r.name, slug: r.slug, createdAt: r.created_at,
  }));
}

async function migrateUsers() {
  const rows = await sql`SELECT * FROM users`;

  // Firebase Auth import preserves bcrypt hashes → no password reset
  const userImports = rows.map((r: any) => ({
    uid: r.id,
    email: r.email,
    displayName: r.name,
    passwordHash: Buffer.from(r.password_hash),
    customClaims: { role: r.role, clubId: r.club_id },
  }));

  for (let i = 0; i < userImports.length; i += 1000) {
    await auth.importUsers(userImports.slice(i, i + 1000), {
      hash: { algorithm: "BCRYPT" },
    });
  }

  await bulkWrite("users", rows as any[], (r) => ({
    email: r.email,
    name: r.name,
    role: r.role,
    clubId: r.club_id,
    playerId: r.player_id,
    mustResetPassword: r.must_reset_password,
    createdAt: r.created_at,
  }));
}

async function migratePlayers() {
  const rows = await sql`SELECT * FROM players`;
  await bulkWrite("players", rows as any[], (r) => ({
    name: r.name, email: r.email, clubId: r.club_id, userId: r.user_id,
    seasonRank: r.season_rank, wins: r.wins, losses: r.losses,
    doves: r.doves, doveWins: r.dove_wins, forfeits: r.forfeits,
    totalPoints: parseFloat(r.total_points), createdAt: r.created_at,
  }));
}

async function migrateLeagueNights() {
  const rows = await sql`SELECT * FROM league_nights`;

  // Public event doc
  await bulkWrite("leagueNights", rows as any[], (r) => ({
    clubId: r.club_id, date: r.date,
    attendingPlayerIds: r.attending_player_ids || [],
    boardCount: r.board_count, status: r.status,
    rsvpDeadline: r.rsvp_deadline, rsvpToken: r.rsvp_token,
    hostUserId: r.host_user_id, createdAt: r.created_at,
  }));

  // Private timer doc (placeholder, host populates when running)
  await bulkWrite("leagueNightTimers", rows as any[], (r) => ({
    hostUserId: r.host_user_id,
    timerEndsAt: null,
    timerDurationSec: 0,
    timerPausedAt: null,
    isRunning: false,
  }));
}

async function migrateRsvps() {
  const rows = await sql`SELECT * FROM rsvps`;
  await bulkWrite(
    "rsvps", rows as any[],
    (r) => ({ leagueNightId: r.league_night_id, userId: r.user_id, createdAt: r.created_at }),
    (r) => `${r.league_night_id}_${r.user_id}`
  );
}

async function migratePairStats() {
  const rows = await sql`SELECT * FROM pair_stats`;
  await bulkWrite(
    "pairStats", rows as any[],
    (r) => ({
      playerIdA: r.player_id_a, playerIdB: r.player_id_b,
      gamesPlayed: r.games_played, wins: r.wins, createdAt: r.created_at,
    }),
    (r) => pairId(r.player_id_a, r.player_id_b)
  );
}

async function migrateMatchupHistory() {
  const rows = await sql`SELECT * FROM matchup_history`;
  await bulkWrite(
    "matchupHistory", rows as any[],
    (r) => ({
      teamAPlayerIds: r.team_a_player_ids,
      teamBPlayerIds: r.team_b_player_ids,
      gamesPlayed: r.games_played,
      winnerHistory: r.winner_history || [],
      createdAt: r.created_at,
    }),
    (r) => r.matchup_key
  );
}

// (rounds, fixtures, inviteTokens, handicapSettings, contactMessages,
//  registrationRequests follow same pattern — see full script in repo)

async function main() {
  console.log("🚀 Starting migration…\n");
  await migrateClubs();
  await migrateUsers();
  await migratePlayers();
  await migrateLeagueNights();
  await migrateRsvps();
  await migratePairStats();
  await migrateMatchupHistory();
  // ... rest
  console.log("\n✅ Migration complete.");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
```

### Run

```bash
# ALWAYS test on a separate Firebase project first
npx tsx migrate-to-firestore.ts
```

### Critical notes

- **Idempotent-ish:** Re-running OVERWRITES docs (uses `batch.set`). Safe to retry.
- **Auth import:** If `importUsers` fails for some rows, check the bcrypt rounds in your hashes (Firebase needs to know parameters).
- **Foreign keys:** Firestore doesn't enforce them. Stale IDs in your Postgres data will remain stale in Firestore.

---

## 6. Security Rules

Save as `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function role() { return request.auth.token.role; }
    function isSuperAdmin() { return isSignedIn() && role() == 'super_admin'; }
    function isClubManager() { return isSignedIn() && role() == 'club_manager'; }
    function isHost() { return isSignedIn() && role() == 'host'; }
    function isStaff() { return isSuperAdmin() || isClubManager() || isHost(); }

    match /clubs/{clubId} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isStaff());
      allow update: if request.auth.uid == userId || isSuperAdmin();
      allow create, delete: if isSuperAdmin();
    }

    match /players/{playerId} {
      allow read: if isSignedIn();
      allow write: if isStaff();
    }

    match /leagueNights/{nightId} {
      allow read: if isSignedIn();
      allow write: if isStaff();
    }

    // TIMER: host (owner) + super_admin only
    match /leagueNightTimers/{nightId} {
      allow read: if isSuperAdmin() ||
                     (isHost() && resource.data.hostUserId == request.auth.uid);
      allow write: if isSuperAdmin() ||
                      (isHost() && resource.data.hostUserId == request.auth.uid);
    }

    match /rsvps/{rsvpId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() &&
                       request.resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() &&
                       (resource.data.userId == request.auth.uid || isStaff());
    }

    match /rounds/{roundId} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /fixtures/{fixtureId} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /pairStats/{pairId} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /matchupHistory/{key} { allow read: if isSignedIn(); allow write: if isStaff(); }
    match /handicapSettings/{id} { allow read: if isSignedIn(); allow write: if isSuperAdmin(); }
    match /inviteTokens/{id} { allow read: if true; allow write: if isClubManager() || isSuperAdmin(); }

    match /contactMessages/{id} {
      allow create: if true;
      allow read, update: if isSuperAdmin();
    }
    match /registrationRequests/{id} {
      allow create: if true;
      allow read, update: if isStaff();
    }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

---

## 7. Composite Indexes

Firestore auto-creates single-field indexes. Compound queries need composite indexes declared in `firestore.indexes.json`:

```json
{
  "indexes": [
    { "collectionGroup": "players", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clubId", "order": "ASCENDING" },
        { "fieldPath": "totalPoints", "order": "DESCENDING" }
      ]
    },
    { "collectionGroup": "leagueNights", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clubId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    { "collectionGroup": "rounds", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "leagueNightId", "order": "ASCENDING" },
        { "fieldPath": "roundNumber", "order": "ASCENDING" }
      ]
    }
    // ... see full file in repo for all indexes
  ]
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

**Tip:** Firestore logs a console link to auto-create an index whenever a query fails with `FAILED_PRECONDITION`. Use those links in dev to populate this file.

---

## 8. Auth Migration (NextAuth → Firebase Auth)

### Why switch fully

- Firebase Auth = managed password reset, email verify, MFA
- Custom claims encode roles → no DB lookup per request
- Firestore security rules can read `request.auth.token.role` directly
- Session cookies work with Next.js App Router middleware

### Setup

```bash
npm install firebase firebase-admin
npm uninstall next-auth bcryptjs
```

### Client config: `lib/firebase/client.ts`

```ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Server config: `lib/firebase/admin.ts`

```ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
```

### Session cookie pattern (App Router)

**Login server action:**
```ts
// app/login/actions.ts
"use server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();

  // 5-day session cookie
  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  cookies().set("session", sessionCookie, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}
```

**Middleware: `middleware.ts`** (replaces your `proxy.ts`)
```ts
import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  // Verify via API route (middleware runs on Edge — firebase-admin needs Node)
  const verify = await fetch(`${req.nextUrl.origin}/api/auth/verify`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });
  if (!verify.ok) return NextResponse.redirect(new URL("/login", req.url));

  const { role } = await verify.json();

  // Role-based protection
  if (req.nextUrl.pathname.startsWith("/admin") && role !== "super_admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/host/:path*", "/dashboard/:path*"],
};
```

**Verify route: `app/api/auth/verify/route.ts`**
```ts
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function GET() {
  const session = cookies().get("session")?.value;
  if (!session) return new Response("Unauthorized", { status: 401 });
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return Response.json({ uid: decoded.uid, role: decoded.role });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
```

### Setting custom claims (run once per user, or on role change)

```ts
import { adminAuth } from "@/lib/firebase/admin";

await adminAuth.setCustomUserClaims(uid, { role: "host", clubId: "abc123" });
// User must refresh token to see new claim:
// On client: await user.getIdToken(true);
```

---

## 9. Database Layer (Drizzle → Firestore Admin SDK)

### Translation patterns

**Drizzle:**
```ts
const player = await db.select().from(players).where(eq(players.id, id)).limit(1);
```

**Firestore:**
```ts
const snap = await adminDb.collection("players").doc(id).get();
const player = snap.exists ? { id: snap.id, ...snap.data() } : null;
```

---

**Drizzle (where + order):**
```ts
const list = await db.select().from(players)
  .where(eq(players.clubId, clubId))
  .orderBy(desc(players.totalPoints));
```

**Firestore:**
```ts
const snap = await adminDb.collection("players")
  .where("clubId", "==", clubId)
  .orderBy("totalPoints", "desc")
  .get();
const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```
*Requires composite index on `(clubId, totalPoints DESC)`.*

---

**Drizzle (insert):**
```ts
await db.insert(players).values({ name, clubId, ... });
```

**Firestore:**
```ts
await adminDb.collection("players").add({
  name, clubId,
  createdAt: FieldValue.serverTimestamp()
});
```

---

**Drizzle (update):**
```ts
await db.update(players).set({ wins: sql`wins + 1` }).where(eq(players.id, id));
```

**Firestore (atomic increment):**
```ts
import { FieldValue } from "firebase-admin/firestore";
await adminDb.collection("players").doc(id).update({
  wins: FieldValue.increment(1)
});
```

---

**Drizzle (join via two queries):**
```ts
const night = await db.select().from(leagueNights).where(eq(leagueNights.id, id));
const playerDocs = await db.select().from(players)
  .where(inArray(players.id, night.attendingPlayerIds));
```

**Firestore (no joins — fetch in parallel):**
```ts
const night = (await adminDb.collection("leagueNights").doc(id).get()).data();
const playerRefs = night.attendingPlayerIds.map(pid =>
  adminDb.collection("players").doc(pid)
);
const playerSnaps = await adminDb.getAll(...playerRefs);
const playerList = playerSnaps.map(s => ({ id: s.id, ...s.data() }));
```
*`getAll` batches reads — single round-trip.*

---

### Server component pattern (no API layer needed)

```tsx
// app/players/page.tsx
import { adminDb } from "@/lib/firebase/admin";

export default async function PlayersPage() {
  const snap = await adminDb.collection("players")
    .orderBy("totalPoints", "desc").limit(50).get();
  const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  return <PlayerList players={players} />;
}
```

### Server action pattern (mutations)

```ts
// app/host/actions.ts
"use server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function recordWin(playerId: string) {
  await adminDb.collection("players").doc(playerId).update({
    wins: FieldValue.increment(1),
    totalPoints: FieldValue.increment(3),
  });
}
```

---

## 10. Real-Time Event Management

### Timer pattern (server-authoritative)

**Don't store** `secondsRemaining` — clock drift wrecks it.
**Do store** `timerEndsAt` as a Timestamp. Each client computes locally.

**Host starts timer (server action):**
```ts
"use server";
export async function startTimer(nightId: string, durationSec: number) {
  const endsAt = new Date(Date.now() + durationSec * 1000);
  await adminDb.collection("leagueNightTimers").doc(nightId).update({
    timerEndsAt: endsAt,
    timerDurationSec: durationSec,
    timerPausedAt: null,
    isRunning: true,
  });
}
```

**Host client component (subscribes to timer):**
```tsx
"use client";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useEffect, useState } from "react";

export function HostTimer({ nightId }: { nightId: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "leagueNightTimers", nightId), (snap) => {
      const data = snap.data();
      if (!data?.timerEndsAt) return setRemaining(0);
      const endsAt = data.timerEndsAt.toMillis();
      const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
      tick();
      const id = setInterval(tick, 250);
      return () => clearInterval(id);
    });
    return unsub;
  }, [nightId]);

  return <div>{Math.floor(remaining / 1000)}s</div>;
}
```

### Score updates (real-time for all players)

Embed scores in the `leagueNight` doc OR `fixtures` doc — both work. Since fixtures already exist in your schema, update there:

**Server action:**
```ts
"use server";
export async function updateFixtureScore(
  fixtureId: string,
  team: "teamA" | "teamB",
  score: number
) {
  await adminDb.collection("fixtures").doc(fixtureId).update({
    [`${team}.score`]: score,
  });
}
```

**Player client component:**
```tsx
"use client";
import { onSnapshot, query, collection, where } from "firebase/firestore";

useEffect(() => {
  const q = query(collection(db, "fixtures"), where("roundId", "==", roundId));
  return onSnapshot(q, (snap) => {
    setFixtures(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}, [roundId]);
```

### Cost awareness

Real-time listeners cost **1 read per doc per change per connected client**.

Example: 30 players watching 3 fixtures. Host updates a score → 3 fixtures × 30 listeners = 90 reads. At 200 updates/night → 18,000 reads. Free tier (50K/day) handles this easily.

**Watch out:** Don't put listeners on entire collections without `where()` filters.

---

## 11. Cloud Run Deployment

### Why Cloud Run over App Hosting

- ✅ 2M requests/month free, forever (not just "below threshold")
- ✅ Scales to zero (no idle cost)
- ✅ Same underlying infra as App Hosting
- ❌ Slightly more manual setup (Dockerfile)

### Dockerfile

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Next.js config (`next.config.ts`)

```ts
const nextConfig = {
  output: "standalone", // critical for Cloud Run
};
export default nextConfig;
```

### `.dockerignore`

```
node_modules
.next
.git
.env*
firebase-service-account.json
```

### Deploy

```bash
# 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_FIREBASE_PROJECT_ID

# 2. Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 3. Deploy from source (Cloud Build builds + deploys in one step)
gcloud run deploy mighty-flights \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 2 \
  --memory 512Mi \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=...,FIREBASE_PROJECT_ID=...,FIREBASE_CLIENT_EMAIL=...

# Private key needs special handling due to newlines:
gcloud run services update mighty-flights \
  --region us-central1 \
  --set-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest
```

### Continuous deployment from GitHub

Connect via Cloud Console:
1. Cloud Run → mighty-flights → "Setup Continuous Deployment"
2. Authorize GitHub → select `mighty-flights-google` repo
3. Branch: `master`
4. Build type: Dockerfile

Push to master → auto-deploy.

### Critical flags

- `--max-instances 2` — caps concurrent compute (cost control)
- `--min-instances 0` — scale to zero when idle (free)
- `--memory 512Mi` — Next.js standalone typically needs this minimum

---

## 12. Custom Domain Setup

### Direct domain, no redirect

```bash
gcloud beta run domain-mappings create \
  --service mighty-flights \
  --domain mightyflights.co.za \
  --region us-central1
```

This outputs DNS records to add at your registrar:
- 4 A records (IPv4)
- 4 AAAA records (IPv6)

For `www.mightyflights.co.za`, add a CNAME → `ghs.googlehosted.com`.

**SSL certificate** is auto-provisioned and auto-renewed by Google. Takes 15–60 minutes to activate.

Verify domain ownership: Google Search Console → add property → DNS TXT record.

---

## 13. Cost Controls

### Hard caps (set these immediately)

**Cloud Run instance limit:**
```bash
gcloud run services update mighty-flights \
  --region us-central1 \
  --max-instances 2
```

**Firestore daily quota (App Engine console):**
- Console → App Engine → Settings → Spending → Daily spending limit
- Set to $0.50 — quota errors return when exceeded, but no surprise bill

**Budget alerts:**
- Cloud Console → Billing → Budgets & alerts → Create budget
- Threshold: $1, $5, $10
- Email notifications

### Query patterns to minimize reads

1. **Always `.limit()`** on list queries
2. **Filter before ordering** — `where().orderBy()` uses indexes
3. **Cache static-ish reads** with Next.js `unstable_cache`:
   ```ts
   import { unstable_cache } from "next/cache";
   const getClub = unstable_cache(
     async (id) => (await adminDb.collection("clubs").doc(id).get()).data(),
     ["club"], { revalidate: 3600 }
   );
   ```
4. **Avoid `getDocs(collection(...))` without `where()`** — reads entire collection
5. **Use `getAll(...refs)`** for batched lookups instead of N separate `.get()` calls

---

## 14. Rollback Plan

The original Vercel/Supabase app stays alive on its old repo. Rollback = DNS change only.

### During migration

- Original DNS still points to Vercel
- Test new Cloud Run app at its `.run.app` URL
- Only switch DNS after validation

### Rollback steps

1. Re-point domain DNS back to Vercel (A records → 76.76.21.21 or as Vercel specifies)
2. Original app keeps working (it never stopped)
3. Note: any data written to Firestore after cutover is NOT synced back to Supabase

### Recommended cutover window

- Run migration script against production Supabase → Firestore (read-only on Supabase side, safe)
- Deploy Cloud Run version
- Test with super_admin account on `.run.app` URL
- Switch DNS during low-traffic window
- Monitor for 24h
- After 1 week of stable operation, decommission Vercel

---

## Final Checklist

- [ ] Repo cloned to `mighty-flights-google`, pushed to new GitHub
- [ ] Firebase project created, Blaze plan enabled
- [ ] Firestore + Auth services enabled
- [ ] Service account JSON downloaded (gitignored)
- [ ] Migration script run on TEST Firebase project first
- [ ] `firestore.rules` deployed
- [ ] `firestore.indexes.json` deployed
- [ ] NextAuth removed, Firebase Auth client + admin configured
- [ ] All Drizzle queries rewritten to Firestore Admin SDK
- [ ] Real-time timer + score components built
- [ ] Dockerfile + `next.config.ts` standalone output
- [ ] Cloud Run deployed with `--max-instances 2`
- [ ] Custom domain mapped, SSL active
- [ ] Budget alerts configured
- [ ] Firestore daily spending limit set
- [ ] Production migration run
- [ ] DNS cutover
- [ ] Old Vercel deployment paused (not deleted) for 1 week
- [ ] Drizzle, postgres, bcryptjs, next-auth packages uninstalled

---

## Quick Reference: File Locations

| File | Purpose |
|---|---|
| `migrate-to-firestore.ts` | One-shot data migration script |
| `firestore.rules` | Security rules |
| `firestore.indexes.json` | Composite indexes |
| `lib/firebase/client.ts` | Client SDK init |
| `lib/firebase/admin.ts` | Admin SDK init |
| `middleware.ts` | Route protection (replaces `proxy.ts`) |
| `Dockerfile` | Cloud Run build |
| `next.config.ts` | Must have `output: "standalone"` |

---

## Estimated Timeline

| Phase | Time |
|---|---|
| Repo clone + Firebase setup | 30 min |
| Migration script run + verify | 1–2 hr |
| NextAuth → Firebase Auth swap | 4–6 hr |
| Drizzle → Firestore query rewrite | 1–3 days (depends on query count) |
| Real-time timer/score components | 2–4 hr |
| Cloud Run deployment + custom domain | 1–2 hr |
| End-to-end testing | 1 day |
| Production cutover | 30 min |

**Total: 3–6 days of focused work.**
