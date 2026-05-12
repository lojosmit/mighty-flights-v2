# Mighty Flights — Design Document

For handing to Claude in VS Code. Build in order. Do not skip ahead.

---

## 0. Instructions for Claude (READ FIRST, EVERY SESSION)

**Rules of engagement:**

1. **Build in the order in Section 11.** Do not start a step until the previous one passes its tests. If I ask you to skip ahead, push back.

2. **Tests before implementation** for the rotation engine (Section 6). Write the Section 13 scenarios as unit tests first. Run them. They should fail. Then implement until they pass.

3. **Ask before assuming.** If any rule in this doc is ambiguous in your current context, STOP and ask me. Do not guess. Do not "fill in reasonable defaults."

4. **One file/feature per turn.** Do not generate sprawling multi-file changes in a single response. Show me one piece, let me review, then continue.

5. **Mirror the data model exactly** (Section 2). Field names matter. If you want to add a field, propose it first.

6. **No silent rule changes.** If implementation forces a rule change, raise it as a question. Do not change the doc unilaterally.

7. **State management is the hardest part.** The rotation engine is a pure function: `(previousRound, players, boardCount) → nextRound`. Keep it pure. No side effects inside it. Persistence happens outside.

8. **When uncertain about a rule, quote the relevant section** of this doc back to me and ask. Do not paraphrase rules from memory — re-read the doc.

9. **No premature optimization.** No caching, no memoization, no fancy state libraries until something is actually slow.

10. **Stack — DO NOT DEVIATE:**
    - Next.js 15 (App Router) + TypeScript
    - Tailwind CSS + shadcn/ui (restyled to match UIUX.md tokens)
    - PostgreSQL via Supabase
    - Drizzle ORM
    - Supabase Auth (host login) + Supabase Realtime (player spectator view)
    - Vitest for unit tests
    - Zustand for client state
    - date-fns for date/time math
    - Hosted on Vercel + Supabase free tiers

    Do NOT introduce new dependencies without asking. Do NOT swap any of the above for an alternative. If you think something is missing, raise it as a question first.

**Red flags that mean you should stop and ask:**
- You're about to write more than ~150 lines in one go
- You're inventing a rule not in this doc
- You're about to touch a file outside the current build step
- A test is failing and you want to "adjust" the test

---

## 1. Glossary

- **Player** — a registered league member.
- **Pair** — two players assigned to play together for one or more rounds.
- **Fixture** — one match: pair vs pair (2v2) or solo vs solo (1v1).
- **Board** — a physical dartboard. Labeled A, B, C, D, E… Board A is always highest active.
- **Round** — one cycle where every active board plays one fixture simultaneously.
- **League Night** — one evening of play, contains multiple rounds.
- **Season** — 10 league nights across 10 months.
- **Selection Pool** — players currently not on any board and not on the bench.
- **Bench** — players who sat out the previous round and MUST play next round.
- **Streak** — consecutive wins by a pair on ANY board (caps at 3). Counter starts the moment a pair wins together, persists as they get promoted upward. Resets to 0 when the pair is split (hit 3 on Board A) or broken up for any reason.
- **Dove** — ceremony triggered by a special win. App only records the event count.

---

## 2. Data Model

### Player
```
id
name
seasonRank (int, recalculated each league night)
handicapMultiplier (derived from seasonRank)
stats: { wins, doves, doveWins, losses }
```

### LeagueNight
```
id
date
hostId
attendingPlayerIds[]
boardCount (1–N, locked after first round but can be reduced)
rounds[]
```

### Round
```
id
roundNumber
boards[] — array of Fixture
bench[] — playerIds who sat this round
```

### Fixture
```
id
boardLabel (A, B, C…)
type (2v2 | 1v1)
teamA: { playerIds[], score, handicapApplied }
teamB: { playerIds[], score, handicapApplied }
result (teamA_win | teamB_win | special_win_A | special_win_B | double_forfeit | in_progress)
forfeitReason (optional — "5_round_no_bull")
```

### Pair (tracked for streak)
```
playerIds[2]
currentBoard
streakCount (0–3)
```

---

## 3. Handicap Multipliers

Default table, customizable in app settings:

| Rank   | Multiplier |
|--------|------------|
| 1, 2   | 1.0        |
| 3, 4   | 1.1        |
| 5, 6   | 1.2        |
| 7, 8   | 1.3        |
| 9, 10  | 1.4        |
| 11, 12 | 1.5        |
| …      | +0.1 each pair |

**Rules:**
- Applied to in-game score, NOT to bonus points.
- Bonus point (special win) is always +1 flat.
- Rank locks at start of each league night, applies to whole night.

---

## 4. Board Count Selection

Run once at start of league night. Can be reduced (not increased) if players leave.

| Players | Allowed Board Counts |
|---------|---------------------|
| < 6     | League night cannot run |
| 6, 7    | 1 or 2 |
| 8, 9    | 1 or 2 |
| 10–13   | 1, 2, or 3 |
| 14–17   | 1, 2, 3, or 4 |
| 18–21   | 1, 2, 3, 4, or 5 |

**Formula:**
```
maxBoards = floor(players / 4) if players % 4 in (0, 1)
maxBoards = floor((players - (players % 4) + 4) / 4) if players % 4 in (2, 3)
```

Host picks any value from 1 to maxBoards.

---

## 5. Fixture Type Per Board (given P players, B boards)

Boards fill from A downward. Each board needs 4 players for 2v2 or 2 for 1v1.

**Algorithm:**
```
remaining = P

// Board A is ALWAYS 2v2 — never 1v1. If remaining < 4 here, board count was wrong.
assert remaining >= 4
assign Board A as 2v2, remaining -= 4

for each remaining board (B, C, D…):
  if remaining >= 4: fill as 2v2, remaining -= 4
  else if remaining >= 2: fill as 1v1, remaining -= 2
  else: leave empty
benchCount = remaining
```

This means the board-count selection rules in the table above already guarantee at least 4 players on Board A.

**Example checks:**
- 6 players, 2 boards → A=2v2, B=1v1, bench=0
- 7 players, 2 boards → A=2v2, B=1v1, bench=1
- 10 players, 2 boards → A=2v2, B=2v2, bench=2
- 10 players, 3 boards → A=2v2, B=2v2, C=1v1, bench=0
- 11 players, 3 boards → A=2v2, B=2v2, C=1v1, bench=1

---

## 6. Rotation Engine — End of Round

This is the heart of the system. Run this every round end.

### Inputs
- Previous round results (winners/losers per board)
- Active pairs and their streak counts
- Current bench
- Player count (may have changed if host added/removed players)
- Current board count

### Outputs
- Next round's fixtures (with players placed)
- Next round's bench

### Step-by-step

**Step 1: Resolve Board A**
- Board A is ALWAYS 2v2. Never 1v1. Enforce when generating fixtures.
- If winning pair on Board A just hit streak = 3:
  - Split the pair. Both players go to selection pool. Streak resets to 0.
  - Board A needs 2 new slots (filled by promotion in Step 2).
- If winning pair on Board A has streak < 3:
  - Pair stays on Board A. Streak += 1.

**Step 2: Promote winners from lower boards**
- Walk boards bottom-up (lowest first, then next, up to B).
- Winners on each board move up one board.
  - A winning PAIR keeps its accumulated streak when promoted, then +1 for this win.
  - A winning SOLO (from 1v1 on Boards B/C/D…) is promoted with streak 0 — they need a partner before a streak can exist.
- A pair that just won keeps streak going whether they stayed (Board A) or got promoted, unless split at streak 3.

**Step 3: Build the available pool**
- Available pool = all players NOT currently slotted to a board after steps 1–2.
- This includes: losers from all boards, split-up Board A winners, prior round's bench.

**Step 4: Apply bench rule (MANDATORY FIRST)**
- Every player on the previous round's bench MUST be slotted into the next round before anyone from the regular pool.
- They fill open slots starting from the lowest board upward.

**Step 5: Fill remaining slots**
- Use random selection from remaining pool. (Host can override — see Step 7.)
- Prioritize filling 2v2 fixtures completely before any 1v1.
- If a solo slot exists on Board A and a player needs to be paired with the staying winner, that pair starts at streak 0.

**Step 6: Determine new bench**
- Anyone left in the pool after all boards are filled goes to the bench.

**Step 7: Host override**
- Before locking the round, host can swap any two players between slots (or slot↔bench).
- Override is logged with timestamp + host ID.

---

## 7. Scoring — Per Fixture

Each fixture produces ONE of these results:

| Result | Winner gets | Loser gets |
|--------|------------|------------|
| Normal win | +1 win | +1 loss |
| Special win | +1 win, +1 dove-win | +1 loss, +1 dove |
| Double forfeit (5 rounds no bull) | +1 loss | +1 loss |

In-game score (the actual dart score during play) is multiplied by handicap. Bonus point for special win is NOT multiplied.

---

## 8. Player Stats Tracked

Per player, per season AND lifetime:
- `wins` — total fixture wins
- `losses` — total fixture losses
- `doves` — special losses (got dove'd)
- `doveWins` — special wins (gave a dove)
- `forfeits` — double-forfeit losses

Per pair (any two players who have ever played together):
- `gamesPlayed`
- `wins`
- `winRatio`

Per matchup (pair vs pair, or solo vs solo):
- `gamesPlayed`
- `winnerHistory[]`

---

## 9. Predictions / Odds (Phase 2)

When two pairs are about to play:
- Calculate each player's individual win rate
- Calculate the pair's combined win rate (if they've played together before)
- Calculate head-to-head history against the opposing pair
- Output: simple win probability % for each side

Formula (suggested starting point):
```
pairStrength = avg(playerWinRate for each player in pair) * pairSynergyBonus
pairSynergyBonus = 1 + (pairWinRatio - 0.5) * 0.2  // capped between 0.9 and 1.1
winProb_A = pairStrength_A / (pairStrength_A + pairStrength_B)
```

Tune later with real data.

---

## 10. Leaderboard

Sortable by:
- Total wins (default)
- Win ratio
- Doves given (most ruthless)
- Doves taken (most humbled)
- Games played

Trophies are awarded at season end at the **discretion of the club owner**. The app does not automate trophy assignment — it just surfaces the stats the owner uses to decide.

---

## 11. Build Order (DO NOT SKIP)

1. **Player roster CRUD** — add/edit/delete players, set rank.
2. **Handicap settings page** — editable multiplier table.
3. **Scorekeeper standalone** — timer + crosses + handicap, no league context. Test fully.
4. **League night setup** — pick attendees, pick board count, generate Round 1.
5. **Rotation engine** — implement Section 6 step by step. Write tests for every player count 6–20.
6. **Round flow** — record fixture results, run rotation, generate next round.
7. **Stats tracking** — wire up Section 8 to fixture results.
8. **Leaderboard view** — Section 10.
9. **Predictions** — Section 9.
10. **Season history view** — past league nights, past fixtures.

---

## 12. Open Decisions (revisit later)

- Authentication: how do players "view" without logging in? (QR code to read-only page?)
- Offline mode: league nights happen in venues with bad wifi.
- Data export: CSV of season stats for the committee.
- Tie-breaker rules for leaderboard.

---

## 13. Test Scenarios (for the rotation engine)

Write each as a unit test. Input = player count + previous round result. Output = next round fixtures + bench.

- 6 players, Round 1 (no previous) → A=2v2, B=1v1, bench=0
- 7 players, Round 2, P7 was benched → P7 must be in Round 2
- 8 players, Board A pair just hit streak 3 → that pair split, promoted Board B winners to A, losers from A drop to B
- 10 players, 2 boards selected, 1 player leaves mid-night → host prompted to reduce to fewer boards? (Decide)
- 10 players, 3 boards, Board C is 1v1, solo winner promoted to fill Board B slot → arrives with streak 0
- 5-round bull forfeit on Board A → both pairs get loss, both go to pool, Board A filled from promotions