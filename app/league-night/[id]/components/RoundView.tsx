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
import TimerOverlay from "./TimerOverlay";

interface Props {
  round: RoundWithFixtures;
  playerMap: Record<string, string>;
  leagueNightId: string;
  nightStatus: LeagueNightStatus;
  allPlayers: { id: string; name: string }[];
  boardCount: number;
  predictions: Record<string, { probA: number; probB: number } | null>;
  canEdit: boolean;
}

export default function RoundView({
  round,
  playerMap,
  leagueNightId,
  nightStatus,
  allPlayers,
  boardCount,
  predictions,
  canEdit,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingFixtureId, setPendingFixtureId] = useState<string | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const allDone = round.fixtures.every((f) => f.result !== "in_progress");
  const doneCount = round.fixtures.filter((f) => f.result !== "in_progress").length;
  const isActive = nightStatus !== "completed";

  // ── override swap ──────────────────────────────────────────────────────────

  function handlePlayerClick(id: string) {
    if (isPending || !isActive || allDone || !canEdit) return;

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

  async function handleResult(fixtureId: string, result: FixtureResult) {
    if (pendingFixtureId) return;
    setPendingFixtureId(fixtureId);
    try {
      await recordResult(fixtureId, result, leagueNightId);
    } catch (err) {
      console.error("Failed to record result:", err);
    } finally {
      setPendingFixtureId(null);
    }
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
      {/* Always-mounted overlay — keeps timer running when dismissed */}
      <TimerOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        round={round}
        playerMap={playerMap}
        leagueNightId={leagueNightId}
        nightStatus={nightStatus}
        allDone={allDone}
        doneCount={doneCount}
        isPending={isPending}
        canEdit={canEdit}
        selectedPlayerId={selectedId}
        pendingFixtureId={pendingFixtureId}
        predictions={predictions}
        onPlayerClick={handlePlayerClick}
        onRecordResult={handleResult}
        onNextRound={handleGenerate}
        onEnd={handleEnd}
      />

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
        {/* Round heading row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
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
              }}
            >
              Round {round.roundNumber}
            </h1>
          </div>

          {/* Timer button */}
          {isActive && (
            <button
              onClick={() => setOverlayOpen(true)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "10px 20px",
                background: "transparent",
                color: "var(--ink-tertiary)",
                border: "1px solid var(--border-hairline)",
                cursor: "pointer",
                flexShrink: 0,
                marginTop: "8px",
              }}
            >
              ⏱ Timer
            </button>
          )}
        </div>

        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "40px" }} />

        {/* Override banner */}
        {isActive && !allDone && canEdit && (
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
          className="mf-fixture-grid"
          style={{
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
              onRecordResult={isActive && canEdit ? (r) => handleResult(fixture.id, r) : undefined}
              isPendingResult={pendingFixtureId === fixture.id}
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
        {isActive && canEdit && (
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
        {isActive && canEdit && (
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
