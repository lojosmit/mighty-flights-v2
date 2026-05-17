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
  const [playerPanelOpen, setPlayerPanelOpen] = useState(false);

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

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Round heading row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "32px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Title */}
          <div style={{ flexShrink: 0 }}>
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
              {nightStatus === "completed" ? "League Game — Completed" : "League Game — In Progress"}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(48px, 6vw, 72px)",
                fontWeight: 400,
                lineHeight: 1,
                color: "var(--ink-primary)",
              }}
            >
              Round {round.roundNumber}
            </h1>
          </div>

          {/* Bench — inline next to heading */}
          {round.bench.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                Bench
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {round.bench.map((id) => {
                  const isSelected = selectedId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handlePlayerClick(id)}
                      aria-pressed={isSelected}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        background: "var(--bg-elevated)",
                        border: `1px solid ${isSelected ? "var(--accent-gold)" : "var(--border-hairline)"}`,
                        padding: "10px 16px",
                        cursor: canEdit && isActive && !allDone ? "pointer" : "default",
                        transition: "border-color 150ms ease",
                        outline: "none",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 400, lineHeight: 1.2, color: isSelected ? "var(--accent-gold)" : "var(--ink-primary)", transition: "color 150ms ease" }}>
                        {playerMap[id] ?? "—"}
                      </span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                        plays next round
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timer + Players buttons — pushed to far right */}
          {isActive && (
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto", marginTop: "8px", flexShrink: 0 }}>
              {canEdit && (
                <button
                  onClick={() => setPlayerPanelOpen(true)}
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
                  }}
                >
                  Players
                </button>
              )}
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
                }}
              >
                ⏱ Timer
              </button>
            </div>
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
          data-boards={round.fixtures.length}
          style={{
            gridTemplateColumns: `repeat(${round.fixtures.length}, 1fr)`,
            maxWidth: `min(100%, ${round.fixtures.length * 480 + (round.fixtures.length - 1) * 24}px)`,
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

        {/* Player changes drawer — admin/host only */}
        {canEdit && (
          <PlayerChangesPanel
            leagueNightId={leagueNightId}
            attendees={allPlayers.filter((p) => playerMap[p.id] !== undefined)}
            nonAttendees={allPlayers.filter((p) => playerMap[p.id] === undefined)}
            currentBench={round.bench}
            currentFixtures={round.fixtures}
            boardCount={boardCount}
            isOpen={playerPanelOpen}
            onClose={() => setPlayerPanelOpen(false)}
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
                  End game
                </button>
              )}

              {confirmEnd && (
                <>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    End this league game?
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
