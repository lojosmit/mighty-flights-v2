"use client";

import { useEffect, useRef } from "react";
import { useScorekeeperStore } from "@/store/scorekeeper";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Timer() {
  const { timeRemaining, timerRunning, durationMinutes, tick, startTimer, pauseTimer, resetTimer, setDuration, result } =
    useScorekeeperStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLastMinute = timeRemaining <= 60 && timeRemaining > 0;
  const isLocked = result !== "in_progress";

  // Colour shift: ink → gold over the last 60 seconds
  const goldProgress = isLastMinute ? (60 - timeRemaining) / 60 : 0;
  const numericColor = timerRunning && isLastMinute
    ? `color-mix(in srgb, var(--accent-gold) ${Math.round(goldProgress * 100)}%, var(--ink-primary))`
    : "var(--ink-primary)";

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, tick]);

  return (
    <div className="flex flex-col items-end gap-3">
      {/* Duration picker */}
      {!timerRunning && timeRemaining === durationMinutes * 60 && !isLocked && (
        <div className="flex items-center gap-2">
          <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
            Duration
          </span>
          <select
            value={durationMinutes}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="bg-transparent text-small border-b outline-none cursor-pointer"
            style={{
              borderColor: "var(--border-hairline)",
              color: "var(--ink-secondary)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            {[5, 7, 8, 10, 12, 15, 20].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>
      )}

      {/* Numerals */}
      <div
        className="tabular-nums leading-none"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "96px",
          color: numericColor,
          letterSpacing: "-0.02em",
        }}
        aria-live="polite"
        aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
      >
        {formatTime(timeRemaining)}
      </div>

      {/* Gold ring — running=gold, paused=grey */}
      <div
        className="w-full h-px transition-colors duration-300"
        style={{
          backgroundColor: timerRunning ? "var(--accent-gold)" : "var(--ink-tertiary)",
          opacity: timerRunning ? 1 : 0.4,
        }}
      />

      {/* Controls */}
      {!isLocked && (
        <div className="flex gap-4 mt-1">
          {timerRunning ? (
            <button
              onClick={pauseTimer}
              className="text-meta uppercase tracking-widest cursor-pointer"
              style={{ color: "var(--ink-secondary)" }}
            >
              Pause
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="text-meta uppercase tracking-widest cursor-pointer"
              style={{ color: "var(--accent-primary)" }}
            >
              {timeRemaining === durationMinutes * 60 ? "Start" : "Resume"}
            </button>
          )}
          <button
            onClick={resetTimer}
            className="text-meta uppercase tracking-widest cursor-pointer"
            style={{ color: "var(--ink-tertiary)" }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
