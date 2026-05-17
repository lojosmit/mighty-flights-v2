import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getPlayerProfile } from "@/lib/leaderboard";
import ResetPasswordForm from "@/app/admin/ResetPasswordForm";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  club_manager: "Club Manager",
  host: "Host",
  player: "Player",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  marginBottom: "8px",
};

export default async function ProfilePage() {
  await connection();
  const session = await auth();
  if (!session) redirect("/login");

  const [userRow] = await db
    .select({ playerId: users.playerId })
    .from(users)
    .where(eq(users.id, session.user.id));

  const profile = userRow?.playerId ? await getPlayerProfile(userRow.playerId) : null;
  const player = profile?.player ?? null;

  const statBlocks = player
    ? [
        { label: "Games Played", value: String(player.gamesPlayed) },
        { label: "Wins",         value: String(player.wins) },
        { label: "Losses",       value: String(player.losses) },
        { label: "Win %",         value: (player.winRatio * 100).toFixed(1) + "%" },
        { label: "Doves",        value: "—" },
        { label: "Dove Wins",    value: "—" },
      ]
    : [];

  return (
    <main className="mf-page">

      {/* ── Hero header with avatar ───────────────────────────────────────── */}
      <header style={{ marginBottom: "64px" }}>
        <div className="mf-grid-2" style={{ alignItems: "start", gap: "40px", marginBottom: "20px" }}>

          {/* Left: avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-primary)",
                border: "2px solid var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "26px",
                  fontWeight: 500,
                  color: "#fff",
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                {initials(session.user.name ?? "?")}
              </span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-gold)", marginBottom: "6px" }}>
                {ROLE_LABEL[session.user.role] ?? session.user.role}
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(36px, 5vw, 60px)",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                  lineHeight: 1,
                }}
              >
                {session.user.name}
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
                {session.user.email}
              </p>
            </div>
          </div>

          {/* Right: change password */}
          <div
            style={{
              padding: "24px",
              border: "1px solid var(--border-hairline)",
              background: "var(--bg-elevated)",
            }}
          >
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", color: "var(--ink-primary)", marginBottom: "4px" }}>
              Change Password
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", marginBottom: "20px" }}>
              Choose a strong password — minimum 8 characters.
            </p>
            <ResetPasswordForm userId={session.user.id} />
          </div>

        </div>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      {/* ── Season stats + Achievements side by side ─────────────────────── */}
      <section style={{ marginBottom: "72px" }}>
        {player ? (
          <div className="mf-grid-2" style={{ alignItems: "stretch" }}>

            {/* Left: Season Stats */}
            <div>
              <p style={sectionLabelStyle}>Season Stats</p>
              <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "32px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "32px" }}>
                {statBlocks.map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1, marginBottom: "8px" }}>
                      {value}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Achievements — cards flex to match column height */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={sectionLabelStyle}>Achievements</p>
              <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "16px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                {[
                  { label: "3 in a Box", desc: "Three consecutive wins in a night" },
                  { label: "Shanghai",   desc: "Win on singles, doubles & triples" },
                  { label: "Max Score",  desc: "Highest single-game score on record" },
                ].map(({ label, desc }) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "16px 20px",
                      border: "1px solid var(--border-hairline)",
                      background: "var(--bg-elevated)",
                      position: "relative",
                      opacity: 0.55,
                    }}
                  >
                    <span style={{ position: "absolute", top: "10px", right: "10px", fontFamily: "var(--font-body)", fontSize: "8px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gold)", border: "1px solid var(--accent-gold)", padding: "2px 5px" }}>
                      Coming Soon
                    </span>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", color: "var(--ink-primary)", marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* No player linked — achievements full-width */
          <>
            <p style={sectionLabelStyle}>Achievements</p>
            <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "28px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
              {[
                { label: "3 in a Box", desc: "Three consecutive wins in a night" },
                { label: "Shanghai",   desc: "Win on singles, doubles & triples" },
                { label: "Max Score",  desc: "Highest single-game score on record" },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  style={{ padding: "20px", border: "1px solid var(--border-hairline)", background: "var(--bg-elevated)", position: "relative", opacity: 0.55 }}
                >
                  <span style={{ position: "absolute", top: "10px", right: "10px", fontFamily: "var(--font-body)", fontSize: "8px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gold)", border: "1px solid var(--accent-gold)", padding: "2px 5px" }}>
                    Coming Soon
                  </span>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", color: "var(--ink-primary)", marginBottom: "4px" }}>{label}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Career history link ───────────────────────────────────────────── */}
      {player && userRow?.playerId && (
        <section style={{ marginBottom: "72px" }}>
          <p style={sectionLabelStyle}>Career History</p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
          <Link
            href={`/players/${userRow.playerId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-secondary)",
              textDecoration: "none",
              border: "1px solid var(--border-hairline)",
              padding: "12px 20px",
            }}
          >
            Partners &amp; head-to-head →
          </Link>
        </section>
      )}


    </main>
  );
}
