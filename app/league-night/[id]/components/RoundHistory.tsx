import type { RoundWithFixtures } from "@/lib/rounds";
import type { FixtureResult } from "@/lib/db/schema";

interface Props {
  rounds: RoundWithFixtures[];
  playerMap: Record<string, string>;
}

const RESULT_LABEL: Record<FixtureResult, string> = {
  teamA_win:      "A wins",
  teamB_win:      "B wins",
  special_win_A:  "A — dove",
  special_win_B:  "B — dove",
  double_forfeit: "Forfeit",
  in_progress:    "—",
};

const RESULT_COLOR: Record<FixtureResult, string> = {
  teamA_win:      "var(--win)",
  teamB_win:      "var(--win)",
  special_win_A:  "var(--accent-gold)",
  special_win_B:  "var(--accent-gold)",
  double_forfeit: "var(--forfeit)",
  in_progress:    "var(--ink-tertiary)",
};

export default function RoundHistory({ rounds, playerMap }: Props) {
  if (rounds.length === 0) return null;

  return (
    <div style={{ marginTop: "80px" }}>
      <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "48px" }} />

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          marginBottom: "32px",
        }}
      >
        Round history
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {[...rounds].reverse().map((round) => (
          <div key={round.id}>
            <p
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "22px",
                fontWeight: 500,
                color: "var(--ink-secondary)",
                marginBottom: "16px",
              }}
            >
              Round {round.roundNumber}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {round.fixtures.map((f) => {
                const teamA = f.teamA.playerIds.map((id) => playerMap[id] ?? "—").join(" & ");
                const teamB = f.teamB.playerIds.map((id) => playerMap[id] ?? "—").join(" & ");

                return (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "12px 16px",
                      border: "1px solid var(--border-hairline)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--ink-tertiary)",
                        minWidth: "56px",
                      }}
                    >
                      Board {f.boardLabel}
                    </span>

                    <span
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "17px",
                        color: "var(--ink-primary)",
                        flex: 1,
                      }}
                    >
                      {teamA} <span style={{ color: "var(--ink-tertiary)", fontSize: "13px" }}>vs</span> {teamB}
                    </span>

                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: RESULT_COLOR[f.result],
                        minWidth: "80px",
                        textAlign: "right",
                      }}
                    >
                      {RESULT_LABEL[f.result]}
                    </span>
                  </div>
                );
              })}
            </div>

            {round.bench.length > 0 && (
              <p
                style={{
                  marginTop: "8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--ink-tertiary)",
                  letterSpacing: "0.02em",
                }}
              >
                Bench: {round.bench.map((id) => playerMap[id] ?? "—").join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
