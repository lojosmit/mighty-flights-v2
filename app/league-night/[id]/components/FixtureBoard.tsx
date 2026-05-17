"use client";

import type { Fixture, FixtureResult } from "@/lib/db/schema";
import FixtureResultButtons from "./FixtureResultButtons";

interface Props {
  fixture: Fixture;
  playerMap: Record<string, string>;
  selectedPlayerId: string | null;
  onPlayerClick: (id: string) => void;
  isActive?: boolean;
  onRecordResult?: (result: FixtureResult) => void;
  isPendingResult?: boolean;
  prediction?: { probA: number; probB: number } | null;
  playerHandicapMap?: Record<string, number>;
}

export default function FixtureBoard({
  fixture,
  playerMap,
  selectedPlayerId,
  onPlayerClick,
  isActive = false,
  onRecordResult,
  isPendingResult = false,
  prediction,
  playerHandicapMap = {},
}: Props) {
  const teamALabel = fixture.teamA.playerIds
    .map((id) => playerMap[id] ?? "—")
    .join(" & ");
  const teamBLabel = fixture.teamB.playerIds
    .map((id) => playerMap[id] ?? "—")
    .join(" & ");

  return (
    <div className="mf-fixture-board">
      {/* Board letter watermark */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "-48px",
          right: "8px",
          fontFamily: "var(--font-cormorant)",
          fontSize: "240px",
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--ink-primary)",
          opacity: 0.07,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {fixture.boardLabel}
      </span>

      {/* Board meta header */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          marginBottom: "32px",
          position: "relative",
        }}
      >
        Board {fixture.boardLabel} · {fixture.type}
      </p>

      {/* Teams */}
      <div className="mf-fixture-teams" style={{ position: "relative" }}>
        <TeamBlock
          playerIds={fixture.teamA.playerIds}
          playerMap={playerMap}
          selectedPlayerId={isActive && fixture.result === "in_progress" ? selectedPlayerId : null}
          onPlayerClick={isActive && fixture.result === "in_progress" ? onPlayerClick : () => {}}
          playerHandicapMap={playerHandicapMap}
        />

        <div
          className="mf-fixture-vs"
          style={{
            alignSelf: "center",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            flexShrink: 0,
          }}
        >
          vs
        </div>

        <TeamBlock
          playerIds={fixture.teamB.playerIds}
          playerMap={playerMap}
          selectedPlayerId={isActive && fixture.result === "in_progress" ? selectedPlayerId : null}
          onPlayerClick={isActive && fixture.result === "in_progress" ? onPlayerClick : () => {}}
          playerHandicapMap={playerHandicapMap}
        />
      </div>

      {/* Prediction odds — always rendered to keep all cards the same height */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-hairline)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          visibility: fixture.result === "in_progress" ? "visible" : "hidden",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            flexShrink: 0,
          }}
        >
          Odds
        </p>
        {prediction ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--ink-secondary)",
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                color: prediction.probA >= prediction.probB
                  ? "var(--accent-gold)"
                  : "var(--ink-secondary)",
              }}
            >
              A {Math.round(prediction.probA * 100)}%
            </span>
            <span style={{ color: "var(--ink-tertiary)", margin: "0 8px" }}>·</span>
            <span
              style={{
                color: prediction.probB > prediction.probA
                  ? "var(--accent-gold)"
                  : "var(--ink-secondary)",
              }}
            >
              B {Math.round(prediction.probB * 100)}%
            </span>
          </p>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--ink-tertiary)",
              letterSpacing: "0.04em",
            }}
          >
            No history
          </p>
        )}
      </div>

      {/* Result section — pushed to bottom so buttons align across cards */}
      <div style={{ marginTop: "auto" }}>
      {fixture.result !== "in_progress" && (
        <ResultBadge result={fixture.result} teamALabel={teamALabel} teamBLabel={teamBLabel} />
      )}

      {fixture.result === "in_progress" && isActive && onRecordResult && (
        <FixtureResultButtons
          teamALabel="Team A"
          teamBLabel="Team B"
          onResult={onRecordResult}
          isPending={isPendingResult}
        />
      )}
      </div>
    </div>
  );
}

function TeamBlock({
  playerIds,
  playerMap,
  selectedPlayerId,
  onPlayerClick,
  playerHandicapMap,
}: {
  playerIds: string[];
  playerMap: Record<string, string>;
  selectedPlayerId: string | null;
  onPlayerClick: (id: string) => void;
  playerHandicapMap: Record<string, number>;
}) {
  return (
    <div className="mf-fixture-team">
      {playerIds.map((id) => {
        const isSelected = selectedPlayerId === id;
        const handicap = playerHandicapMap[id];
        return (
          <div key={id}>
            <button
              onClick={() => onPlayerClick(id)}
              aria-pressed={isSelected}
              className="mf-fixture-player-btn"
              style={{
                border: `2px solid ${isSelected ? "var(--accent-gold)" : "transparent"}`,
                color: isSelected ? "var(--accent-gold)" : "var(--ink-primary)",
                transition: "color 150ms ease, border-color 150ms ease",
              }}
            >
              {playerMap[id] ?? "—"}
            </button>
            {handicap !== undefined && (
              <p
                style={{
                  paddingLeft: "10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.04em",
                  color: "var(--ink-tertiary)",
                  marginTop: "2px",
                  marginBottom: "6px",
                }}
              >
                ×{handicap}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultBadge({
  result,
  teamALabel,
  teamBLabel,
}: {
  result: FixtureResult;
  teamALabel: string;
  teamBLabel: string;
}) {
  const map: Record<FixtureResult, { label: string; color: string }> = {
    teamA_win:      { label: `${teamALabel} wins`,       color: "var(--win)" },
    teamB_win:      { label: `${teamBLabel} wins`,       color: "var(--win)" },
    special_win_A:  { label: `${teamALabel} — dove`,     color: "var(--accent-gold)" },
    special_win_B:  { label: `${teamBLabel} — dove`,     color: "var(--accent-gold)" },
    double_forfeit: { label: "Double forfeit",           color: "var(--forfeit)" },
    in_progress:    { label: "In progress",              color: "var(--ink-tertiary)" },
  };

  const { label, color } = map[result];

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-hairline)",
        marginTop: "24px",
        paddingTop: "16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </p>
    </div>
  );
}
