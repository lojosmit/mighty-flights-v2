"use client";

import { useState, useEffect, useRef } from "react";
import type { RoundWithFixtures } from "@/lib/rounds";
import type { LeagueNightStatus, FixtureResult } from "@/lib/db/schema";
import FixtureBoard from "./FixtureBoard";

const DURATIONS = [5, 7, 8, 10, 12, 15, 20];
const DEFAULT_MINUTES = 10;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  round: RoundWithFixtures;
  playerMap: Record<string, string>;
  leagueNightId: string;
  nightStatus: LeagueNightStatus;
  allDone: boolean;
  doneCount: number;
  isPending: boolean;
  canEdit: boolean;
  selectedPlayerId: string | null;
  pendingFixtureId: string | null;
  predictions: Record<string, { probA: number; probB: number } | null>;
  onPlayerClick: (id: string) => void;
  onRecordResult: (fixtureId: string, result: FixtureResult) => void;
  onNextRound: () => void;
  onEnd: () => void;
}

export default function TimerOverlay({
  open,
  onClose,
  round,
  playerMap,
  nightStatus,
  allDone,
  doneCount,
  isPending,
  canEdit,
  selectedPlayerId,
  pendingFixtureId,
  predictions,
  onPlayerClick,
  onRecordResult,
  onNextRound,
  onEnd,
}: Props) {
  const [duration, setDuration] = useState(DEFAULT_MINUTES);
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer on new round
  useEffect(() => {
    setRunning(false);
    setDuration(DEFAULT_MINUTES);
    setRemaining(DEFAULT_MINUTES * 60);
    setConfirmEnd(false);
  }, [round.roundNumber]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) { setRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const isLastMinute = remaining <= 60 && remaining > 0;
  const isAtStart = remaining === duration * 60;
  const goldPct = isLastMinute ? Math.round(((60 - remaining) / 60) * 100) : 0;
  const timerColor =
    remaining === 0
      ? "var(--accent-gold)"
      : running && isLastMinute
      ? `color-mix(in srgb, var(--accent-gold) ${goldPct}%, var(--ink-primary))`
      : "var(--ink-primary)";

  const isActive = nightStatus !== "completed";

  const metaStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };

  return (
    // Always mounted — opacity/visibility keeps timer running when dismissed
    <div
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "var(--bg-primary)",
        flexDirection: "column",
        overflow: "auto",
        opacity: open ? 1 : 0,
        visibility: open ? "visible" : "hidden",
        transition: "opacity 220ms ease, visibility 220ms ease",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          height: "64px",
          borderBottom: "1px solid var(--accent-gold)",
          flexShrink: 0,
        }}
      >
        <p style={{ ...metaStyle, color: "var(--ink-tertiary)" }}>
          {nightStatus === "completed" ? "Completed" : "In Progress"} — Round {round.roundNumber}
        </p>
        <button
          onClick={onClose}
          style={{
            ...metaStyle,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-tertiary)",
          }}
        >
          Close ✕
        </button>
      </div>

      {/* ── Timer section ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 48px 40px",
          flexShrink: 0,
        }}
      >
        {/* Duration picker */}
        {!running && isAtStart && isActive && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ ...metaStyle, color: "var(--ink-tertiary)" }}>Duration</span>
            <select
              value={duration}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10);
                setDuration(m);
                setRemaining(m * 60);
              }}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-hairline)",
                outline: "none",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--ink-secondary)",
              }}
            >
              {DURATIONS.map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        )}

        {/* Clock numerals */}
        <div
          aria-live="polite"
          aria-label={`Time remaining: ${fmt(remaining)}`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(120px, 20vw, 260px)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: timerColor,
            transition: "color 300ms ease",
          }}
        >
          {fmt(remaining)}
        </div>

        {/* Gold progress line */}
        <div
          style={{
            width: "min(320px, 60vw)",
            height: "2px",
            marginTop: "20px",
            backgroundColor: running ? "var(--accent-gold)" : "var(--border-hairline)",
            transition: "background-color 300ms ease",
          }}
        />

        {/* Controls */}
        {isActive && (
          <div style={{ display: "flex", gap: "32px", marginTop: "20px" }}>
            {running ? (
              <button
                onClick={() => setRunning(false)}
                style={{ ...metaStyle, background: "none", border: "none", cursor: "pointer", color: "var(--ink-secondary)" }}
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => setRunning(true)}
                disabled={remaining === 0}
                style={{
                  ...metaStyle,
                  background: "none",
                  border: "none",
                  cursor: remaining === 0 ? "default" : "pointer",
                  color: remaining === 0 ? "var(--ink-tertiary)" : "var(--accent-primary)",
                }}
              >
                {isAtStart ? "Start" : "Resume"}
              </button>
            )}
            <button
              onClick={() => { setRemaining(duration * 60); setRunning(false); }}
              style={{ ...metaStyle, background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)" }}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* ── Fixture boards ── */}
      <div style={{ padding: "0 clamp(16px, 4vw, 48px)", flex: 1 }}>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "32px" }} />

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
              selectedPlayerId={selectedPlayerId}
              onPlayerClick={onPlayerClick}
              isActive={isActive}
              onRecordResult={isActive && canEdit ? (r) => onRecordResult(fixture.id, r) : undefined}
              isPendingResult={pendingFixtureId === fixture.id}
              prediction={predictions[fixture.id]}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      {isActive && canEdit && (
        <div
          style={{
            padding: "24px 48px",
            marginTop: "48px",
            borderTop: "1px solid var(--border-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p style={{ ...metaStyle, color: "var(--ink-tertiary)" }}>
            {allDone ? "All boards complete" : `${doneCount} of ${round.fixtures.length} boards complete`}
          </p>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {allDone && !confirmEnd && (
              <button
                onClick={onNextRound}
                disabled={isPending}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  padding: "12px 28px",
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
                  onClick={onEnd}
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
  );
}
