"use client";

import { useState, useTransition } from "react";
import {
  applyOverride,
  recordResult,
  generateNextRound,
  endLeagueNight,
  type RoundWithFixtures,
} from "@/lib/rounds";
import type { FixtureResult, LeagueNightStatus } from "@/lib/db/schema";
import FixtureBoard from "./FixtureBoard";
import BenchDisplay from "./BenchDisplay";
import PlayerChangesPanel from "./PlayerChangesPanel";

interface Props {
  round: RoundWithFixtures;
  playerMap: Record<string, string>;
  leagueNightId: string;
  nightStatus: LeagueNightStatus;
  allPlayers: { id: string; name: string }[];
  boardCount: number;
  predictions: Record<string, { probA: number; probB: number } | null>;
}

export default function RoundView({
  round,
  playerMap,
  leagueNightId,
  nightStatus,
  allPlayers,
  boardCount,
  predictions,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allDone = round.fixtures.every((f) => f.result !== "in_progress");
  const doneCount = round.fixtures.filter((f) => f.result !== "in_progress").length;
  const isActive = nightStatus !== "completed";

  // ── override swap ──────────────────────────────────────────────────────────

  function handlePlayerClick(id: string) {
    if (isPending || !isActive || allDone) return;

    if (!selectedId) { setSelectedId(id); return; }
    if (selectedId === id) { setSelectedId(null); return; }

    const a = selectedId;
    const b = id;
    setSelectedId(null);
    startTransition(async () => {
      await applyOverride(round.id, leagueNightId, a, b);
    });
  }

  // ── result recording ───────────────────────────────────────────────────────

  function handleResult(fixtureId: string, result: FixtureResult) {
    startTransition(async () => {
      await recordResult(fixtureId, result, leagueNightId);
    });
  }

  // ── generate / end ─────────────────────────────────────────────────────────

  function handleGenerate() {
    startTransition(async () => {
      await generateNextRound(leagueNightId);
    });
  }

  function handleEnd() {
    startTransition(async () => {
      await endLeagueNight(leagueNightId);
    });
  }

  const swapActive = !!selectedId && !isPending && !allDone;

  return (
    <div style={{ position: "relative" }}>
      {/* Round number watermark */}
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
          {nightStatus === "completed" ? "League Night — Completed" : "League Night — In Progress"}
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

        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "40px" }} />

        {/* Override banner — only when no results recorded yet */}
        {isActive && !allDone && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
              padding: "12px 20px",
              border: `1px solid ${swapActive ? "var(--accent-gold)" : "var(--border-hairline)"}`,
              background: swapActive ? "var(--bg-elevated)" : "transparent",
              transition: "border-color 200ms ease, background 200ms ease",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: swapActive ? "var(--accent-gold)" : "var(--ink-tertiary)",
                letterSpacing: "0.02em",
                transition: "color 200ms ease",
              }}
            >
              {isPending
                ? "Saving…"
                : selectedId
                ? `${playerMap[selectedId] ?? "Player"} selected — click another player to swap`
                : "Click any player name to swap · then record results below"}
            </p>

            {swapActive && (
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
        )}

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
              isActive={isActive}
              onRecordResult={isActive ? (r) => handleResult(fixture.id, r) : undefined}
              isPendingResult={isPending}
              prediction={predictions[fixture.id]}
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

        {/* Player changes */}
        {isActive && (
          <PlayerChangesPanel
            leagueNightId={leagueNightId}
            attendees={allPlayers.filter((p) => playerMap[p.id] !== undefined)}
            nonAttendees={allPlayers.filter((p) => playerMap[p.id] === undefined)}
            currentBench={round.bench}
            currentFixtures={round.fixtures}
            boardCount={boardCount}
          />
        )}

        {/* Footer actions */}
        {isActive && (
          <div
            style={{
              marginTop: "56px",
              paddingTop: "32px",
              borderTop: "1px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            {/* Progress */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--ink-tertiary)",
                letterSpacing: "0.02em",
              }}
            >
              {allDone
                ? "All boards complete"
                : `${doneCount} of ${round.fixtures.length} boards complete`}
            </p>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {allDone && !confirmEnd && (
                <button
                  onClick={handleGenerate}
                  disabled={isPending}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "12px 24px",
                    background: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {isPending ? "Generating…" : "Next round →"}
                </button>
              )}

              {allDone && !confirmEnd && (
                <button
                  onClick={() => setConfirmEnd(true)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "12px 20px",
                    background: "transparent",
                    color: "var(--ink-tertiary)",
                    border: "1px solid var(--border-hairline)",
                    cursor: "pointer",
                  }}
                >
                  End night
                </button>
              )}

              {confirmEnd && (
                <>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    End this league night?
                  </p>
                  <button
                    onClick={handleEnd}
                    disabled={isPending}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "10px 20px",
                      background: "var(--accent-primary)",
                      color: "#ffffff",
                      border: "none",
                      cursor: isPending ? "not-allowed" : "pointer",
                    }}
                  >
                    {isPending ? "…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirmEnd(false)}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "10px 20px",
                      background: "transparent",
                      color: "var(--ink-tertiary)",
                      border: "1px solid var(--border-hairline)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
