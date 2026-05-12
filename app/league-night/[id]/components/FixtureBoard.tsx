"use client";

import type { Fixture } from "@/lib/db/schema";

interface Props {
  fixture: Fixture;
  playerMap: Record<string, string>;
  selectedPlayerId: string | null;
  onPlayerClick: (id: string) => void;
}

export default function FixtureBoard({
  fixture,
  playerMap,
  selectedPlayerId,
  onPlayerClick,
}: Props) {
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
          selectedPlayerId={selectedPlayerId}
          onPlayerClick={onPlayerClick}
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
          selectedPlayerId={selectedPlayerId}
          onPlayerClick={onPlayerClick}
        />
      </div>
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
