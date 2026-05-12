"use client";

import { useState, useTransition } from "react";
import { applyOverride, type RoundWithFixtures } from "@/lib/rounds";
import FixtureBoard from "./FixtureBoard";
import BenchDisplay from "./BenchDisplay";

interface Props {
  round: RoundWithFixtures;
  playerMap: Record<string, string>;
  leagueNightId: string;
}

export default function RoundView({ round, playerMap, leagueNightId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePlayerClick(id: string) {
    if (isPending) return;

    if (!selectedId) {
      setSelectedId(id);
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    const a = selectedId;
    const b = id;
    setSelectedId(null);

    startTransition(async () => {
      await applyOverride(round.id, leagueNightId, a, b);
    });
  }

  const swapBannerActive = !!selectedId && !isPending;

  return (
    <div style={{ position: "relative" }}>
      {/* Round number background watermark */}
      <span
        aria-hidden
        style={{
          position: "fixed",
          bottom: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-cormorant)",
          fontSize: "480px",
          fontWeight: 400,
          lineHeight: 0.85,
          color: "var(--ink-primary)",
          opacity: 0.04,
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {round.roundNumber}
      </span>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Round heading */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            marginBottom: "8px",
          }}
        >
          League Night
        </p>

        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "48px",
            fontWeight: 400,
            lineHeight: 1.05,
            color: "var(--ink-primary)",
            marginBottom: "24px",
          }}
        >
          Round {round.roundNumber}
        </h1>

        <div
          style={{
            height: "1px",
            backgroundColor: "var(--border-hairline)",
            marginBottom: "40px",
          }}
        />

        {/* Override instruction banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            padding: "12px 20px",
            border: `1px solid ${swapBannerActive ? "var(--accent-gold)" : "var(--border-hairline)"}`,
            background: swapBannerActive ? "var(--bg-elevated)" : "transparent",
            transition: "border-color 200ms ease, background 200ms ease",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: swapBannerActive ? "var(--accent-gold)" : "var(--ink-tertiary)",
              letterSpacing: "0.02em",
              transition: "color 200ms ease",
            }}
          >
            {isPending
              ? "Saving swap…"
              : selectedId
              ? `${playerMap[selectedId] ?? "Player"} selected — click another player to swap`
              : "Click any player name to begin a swap override"}
          </p>

          {swapBannerActive && (
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-tertiary)",
                padding: "4px 8px",
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {/* Fixture boards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
            opacity: isPending ? 0.55 : 1,
            transition: "opacity 200ms ease",
          }}
        >
          {round.fixtures.map((fixture) => (
            <FixtureBoard
              key={fixture.id}
              fixture={fixture}
              playerMap={playerMap}
              selectedPlayerId={selectedId}
              onPlayerClick={handlePlayerClick}
            />
          ))}
        </div>

        {/* Bench */}
        <BenchDisplay
          bench={round.bench}
          playerMap={playerMap}
          selectedPlayerId={selectedId}
          onPlayerClick={handlePlayerClick}
        />
      </div>
    </div>
  );
}
