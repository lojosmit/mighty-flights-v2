"use client";

import { useState, useEffect, useRef } from "react";

const DURATIONS = [5, 7, 8, 10, 12, 15, 20];
const DEFAULT_MINUTES = 10;

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  roundNumber: number;
}

export default function RoundTimer({ roundNumber }: Props) {
  const [duration, setDuration] = useState(DEFAULT_MINUTES);
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when the round changes
  useEffect(() => {
    setRunning(false);
    setDuration(DEFAULT_MINUTES);
    setRemaining(DEFAULT_MINUTES * 60);
  }, [roundNumber]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const isLastMinute = remaining <= 60 && remaining > 0;
  const isAtStart = remaining === duration * 60;
  const goldProgress = isLastMinute ? (60 - remaining) / 60 : 0;

  const numericColor =
    running && isLastMinute
      ? `color-mix(in srgb, var(--accent-gold) ${Math.round(goldProgress * 100)}%, var(--ink-primary))`
      : remaining === 0
      ? "var(--accent-gold)"
      : "var(--ink-primary)";

  function changeDuration(mins: number) {
    setDuration(mins);
    setRemaining(mins * 60);
    setRunning(false);
  }

  function reset() {
    setRemaining(duration * 60);
    setRunning(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
      {/* Duration picker — only shown before timer starts */}
      {!running && isAtStart && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
            }}
          >
            Duration
          </span>
          <select
            value={duration}
            onChange={(e) => changeDuration(parseInt(e.target.value, 10))}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--border-hairline)",
              outline: "none",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--ink-secondary)",
            }}
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>
      )}

      {/* Time display */}
      <div
        aria-live="polite"
        aria-label={`Time remaining: ${fmt(remaining)}`}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "72px",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: numericColor,
          transition: "color 300ms ease",
          tabularNums: true,
        } as React.CSSProperties}
      >
        {fmt(remaining)}
      </div>

      {/* Progress line */}
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: running ? "var(--accent-gold)" : "var(--ink-tertiary)",
          opacity: running ? 1 : 0.35,
          transition: "background-color 300ms ease, opacity 300ms ease",
        }}
      />

      {/* Controls */}
      <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
        {running ? (
          <button
            onClick={() => setRunning(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-secondary)",
            }}
          >
            Pause
          </button>
        ) : (
          <button
            onClick={() => setRunning(true)}
            disabled={remaining === 0}
            style={{
              background: "none",
              border: "none",
              cursor: remaining === 0 ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: remaining === 0 ? "var(--ink-tertiary)" : "var(--accent-primary)",
            }}
          >
            {isAtStart ? "Start" : "Resume"}
          </button>
        )}
        <button
          onClick={reset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
