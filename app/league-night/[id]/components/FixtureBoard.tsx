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
}

export default function FixtureBoard({
  fixture,
  playerMap,
  selectedPlayerId,
  onPlayerClick,
  isActive = false,
  onRecordResult,
  isPendingResult = false,
}: Props) {
  const teamALabel = fixture.teamA.playerIds
    .map((id) => playerMap[id] ?? "—")
    .join(" & ");
  const teamBLabel = fixture.teamB.playerIds
    .map((id) => playerMap[id] ?? "—")
    .join(" & ");

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-hairline)",
        padding: "40px 48px",
        minHeight: "240px",
      }}
    >
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "40px",
          position: "relative",
        }}
      >
        <TeamBlock
          playerIds={fixture.teamA.playerIds}
          handicap={fixture.teamA.handicapApplied}
          playerMap={playerMap}
          selectedPlayerId={isActive && fixture.result === "in_progress" ? selectedPlayerId : null}
          onPlayerClick={isActive && fixture.result === "in_progress" ? onPlayerClick : () => {}}
        />

        <div
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
          handicap={fixture.teamB.handicapApplied}
          playerMap={playerMap}
          selectedPlayerId={isActive && fixture.result === "in_progress" ? selectedPlayerId : null}
          onPlayerClick={isActive && fixture.result === "in_progress" ? onPlayerClick : () => {}}
        />
      </div>

      {/* Result section */}
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
  );
}

function TeamBlock({
  playerIds,
  handicap,
  playerMap,
  selectedPlayerId,
  onPlayerClick,
}: {
  playerIds: string[];
  handicap: number;
  playerMap: Record<string, string>;
  selectedPlayerId: string | null;
  onPlayerClick: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "180px" }}>
      {playerIds.map((id) => {
        const isSelected = selectedPlayerId === id;
        return (
          <button
            key={id}
            onClick={() => onPlayerClick(id)}
            aria-pressed={isSelected}
            style={{
              display: "block",
              textAlign: "left",
              background: "none",
              border: `2px solid ${isSelected ? "var(--accent-gold)" : "transparent"}`,
              padding: "2px 8px",
              cursor: "pointer",
              fontFamily: "var(--font-cormorant)",
              fontSize: "30px",
              fontWeight: 400,
              lineHeight: 1.2,
              color: isSelected ? "var(--accent-gold)" : "var(--ink-primary)",
              transition: "color 150ms ease, border-color 150ms ease",
              outline: "none",
            }}
          >
            {playerMap[id] ?? "—"}
          </button>
        );
      })}
      <p
        style={{
          paddingLeft: "10px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.04em",
          color: "var(--ink-tertiary)",
          marginTop: "8px",
        }}
      >
        ×{handicap}
      </p>
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
