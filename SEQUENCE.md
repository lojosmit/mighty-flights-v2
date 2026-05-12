# Mighty Flights — Implementation Sequence

Work top to bottom. Do not start a step until the previous one passes its tests. Each step = one VS Code session.

---

## Phase 0: Setup

- [ ] **0.1** Create Supabase project. Note the connection string and API keys.
- [ ] **0.2** Create Vercel account + GitHub repo. Link them.
- [ ] **0.3** `npx create-next-app@latest mighty-flights --typescript --tailwind --app --eslint`
- [ ] **0.4** Install: `drizzle-orm`, `@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `date-fns`, `drizzle-kit` (dev), `vitest` (dev), `@vitejs/plugin-react` (dev).
- [ ] **0.5** Install shadcn/ui: `npx shadcn@latest init`. Pick: New York style, Slate base, CSS variables.
- [ ] **0.6** Add `DESIGN.md`, `SEQUENCE.md`, `UIUX.md` to repo root. Commit.
- [ ] **0.7** Set up Drizzle config pointing to Supabase. Create empty schema file.
- [ ] **0.8** Configure Tailwind with UIUX.md color tokens as CSS variables (Section 1 of UIUX.md).
- [ ] **0.9** Import Oswald, Inter, JetBrains Mono, Cormorant Garamond via `next/font`.
- [ ] **0.10** Set up Vitest config. Write one dummy test, verify it runs.
- [ ] **0.11** Set up `.env.local` with Supabase keys. Add `.env.example` to repo.
- [ ] **0.12** Deploy a hello-world page to Vercel. Verify deploy pipeline works.

---

## Phase 1: Player Management

- [ ] **1.1** Define `Player` model per DESIGN.md Section 2.
- [ ] **1.2** Persistence layer for players (create, read, update, delete).
- [ ] **1.3** UI: player list view.
- [ ] **1.4** UI: add player form.
- [ ] **1.5** UI: edit player (name, rank).
- [ ] **1.6** UI: delete player with confirmation.
- [ ] **1.7** Tests: CRUD operations.

**Done when:** You can add 20 players, edit them, delete them. Data persists on reload.

---

## Phase 2: Handicap System

- [ ] **2.1** Default handicap table per DESIGN.md Section 3.
- [ ] **2.2** Settings page to edit multipliers.
- [ ] **2.3** Function: `getMultiplier(rank) → number`.
- [ ] **2.4** Tests: rank 1 = 1.0, rank 5 = 1.2, rank 13 = 1.6, custom edits persist.

**Done when:** Editable table works, function returns correct values.

---

## Phase 3: Scorekeeper (Standalone)

This is the in-game board, totally separate from league logic.

- [ ] **3.1** UI: two-team scorekeeper layout.
- [ ] **3.2** Number grid (10–20, double, triple, bull) with 0/1/2/3 cross states per team.
- [ ] **3.3** Tap to add/remove crosses.
- [ ] **3.4** Score input per team with handicap applied.
- [ ] **3.5** Bonus point (special win) toggle — flat +1, no handicap.
- [ ] **3.6** Timer: customizable 5–20 min, always visible, start/pause/reset.
- [ ] **3.7** Win/special win/double forfeit buttons. Result locked when pressed.
- [ ] **3.8** Tests: handicap math, bonus point flat, timer countdown.

**Done when:** Two people can play a full game with this alone. No league context.

---

## Phase 4: League Night Setup

- [ ] **4.1** Define `LeagueNight`, `Round`, `Fixture` models per DESIGN.md Section 2.
- [ ] **4.2** UI: start new league night → select attending players.
- [ ] **4.3** Function: `maxBoards(playerCount)` per DESIGN.md Section 4 formula.
- [ ] **4.4** UI: host picks board count (validated against max).
- [ ] **4.5** Tests: board count for player counts 6–20.

**Done when:** Host can pick attendees and board count. Invalid selections blocked.

---

## Phase 5: Fixture Allocation (Round 1)

- [ ] **5.1** Function: `allocateFixtures(players, boardCount) → boards[] + bench[]` per DESIGN.md Section 5.
- [ ] **5.2** Enforce: Board A is always 2v2.
- [ ] **5.3** Random initial pairing for Round 1.
- [ ] **5.4** UI: display Round 1 fixtures with player names per board.
- [ ] **5.5** UI: bench display.
- [ ] **5.6** Host override: swap any two players (slot↔slot, slot↔bench).
- [ ] **5.7** Override logging.
- [ ] **5.8** Tests: every player count 6–20, every valid board count.

**Done when:** Round 1 fixtures generate correctly for any valid setup.

---

## Phase 6: Rotation Engine

**This is the hardest step. Tests first. No exceptions.**

- [ ] **6.1** Write all Section 13 test scenarios as failing unit tests.
- [ ] **6.2** Define pure function: `nextRound(prevRound, players, boardCount) → newRound`.
- [ ] **6.3** Implement Step 1: Resolve Board A (streak check, split at 3).
- [ ] **6.4** Implement Step 2: Promote winners bottom-up.
- [ ] **6.5** Implement Step 3: Build available pool.
- [ ] **6.6** Implement Step 4: Bench rule (benched players MUST play next round).
- [ ] **6.7** Implement Step 5: Fill remaining slots, 2v2 priority.
- [ ] **6.8** Implement Step 6: Determine new bench.
- [ ] **6.9** Implement Step 7: Host override hook.
- [ ] **6.10** All Section 13 tests pass.
- [ ] **6.11** Add edge case tests: streak carries from Board C → B → A, split mid-promotion, double forfeit handling.

**Done when:** Every Section 13 scenario passes. Function is pure (no side effects).

---

## Phase 7: Round Flow (Wire It Together)

- [ ] **7.1** UI: after Round 1, host records fixture results per board.
- [ ] **7.2** "Generate next round" button calls rotation engine.
- [ ] **7.3** UI: display next round, allow host override before locking.
- [ ] **7.4** UI: round history within current league night (scroll back through past rounds).
- [ ] **7.5** "End league night" button — locks the night, finalizes stats.
- [ ] **7.6** Tests: full league night simulation, 6 rounds, varying player counts mid-night.

**Done when:** A full league night can be played start to finish through the app.

---

## Phase 8: Mid-Night Player Changes

- [ ] **8.1** Host action: add late-arriving player (joins bench).
- [ ] **8.2** Host action: remove leaving player.
- [ ] **8.3** Handle: removing player breaks current board → host prompted to reduce board count.
- [ ] **8.4** Tests: add player at round 3, remove player at round 5, board reduction.

**Done when:** Player count can change mid-night without breaking rotation.

---

## Phase 9: Stats Tracking

- [ ] **9.1** On fixture result, write to player stats per DESIGN.md Section 8.
- [ ] **9.2** Track pair stats (any two players who played together).
- [ ] **9.3** Track matchup history.
- [ ] **9.4** Tests: 10 fixtures recorded, stats math correct.

**Done when:** After a league night, every player's wins/losses/doves are correct.

---

## Phase 10: Leaderboard

- [ ] **10.1** Season leaderboard view per DESIGN.md Section 10.
- [ ] **10.2** Sortable columns.
- [ ] **10.3** Lifetime stats view (across seasons).
- [ ] **10.4** Player detail page: stats, partners, head-to-heads.

**Done when:** Owner can browse season standings and player history.

---

## Phase 11: Predictions

- [ ] **11.1** Function: `winProbability(pairA, pairB) → {probA, probB}` per DESIGN.md Section 9.
- [ ] **11.2** UI: show odds before each fixture starts.
- [ ] **11.3** Hide odds if either pair has zero history (or show "no data").

**Done when:** Reasonable odds appear before each fixture.

---

## Phase 12: Season History

- [ ] **12.1** League night archive view.
- [ ] **12.2** Drill into any past league night → see all rounds, all fixtures.
- [ ] **12.3** Drill into any past fixture → see scores, who won, dove flag.

**Done when:** Owner can audit any past game.

---

## Phase 13: Polish & Deferred Items

- [ ] **13.1** Player read-only view (QR code or share link).
- [ ] **13.2** Offline mode for bad-wifi venues.
- [ ] **13.3** CSV export of season stats.
- [ ] **13.4** Tie-breaker rules for leaderboard.
- [ ] **13.5** Multi-device sync if needed.

---

## Per-Session Checklist (every VS Code session)

Before you start each session:

1. [ ] Tell Claude: "Re-read DESIGN.md before doing anything."
2. [ ] State which phase + step you're on.
3. [ ] Paste the acceptance criteria for this step.
4. [ ] Remind: "Tests before implementation if applicable."

At end of session:

1. [ ] All tests for this step pass.
2. [ ] Commit with a clear message: `feat(phase-N.M): description`.
3. [ ] Update this checklist.