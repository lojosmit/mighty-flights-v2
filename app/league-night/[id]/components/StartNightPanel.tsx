"use client";

import { useState, useTransition } from "react";
import { updateLeagueNight } from "@/lib/league-nights";
import { createRound1 } from "@/lib/rounds";
import { validBoardCounts } from "@/lib/league-night-utils";

interface Props {
  leagueNightId: string;
  playerCount: number;
  minutesUntil: number;
  nightTimeLabel: string;
}

const BOARD_LABELS = ["A", "B", "C", "D", "E"];
const FALLBACK_OPTIONS = [1, 2, 3, 4, 5];

export default function StartNightPanel({
  leagueNightId,
  playerCount,
  minutesUntil,
  nightTimeLabel,
}: Props) {
  const options = validBoardCounts(playerCount);
  const displayOptions = options.length > 0 ? options : FALLBACK_OPTIONS;

  const [boardCount, setBoardCount] = useState(displayOptions[0] ?? 1);
  const [isPending, startTransition] = useTransition();

  if (minutesUntil > 15) {
    return (
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-tertiary)", marginBottom: "8px" }}>
          Game starts at {nightTimeLabel}. Board count is set when you start.
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-tertiary)" }}>
          {minutesUntil > 60
            ? `${Math.round(minutesUntil / 60)}h ${Math.round(minutesUntil % 60)}m away`
            : `${Math.ceil(minutesUntil)} minutes away`}
        </p>
      </div>
    );
  }

  function handleStart() {
    startTransition(async () => {
      await updateLeagueNight(leagueNightId, { boardCount });
      await createRound1(leagueNightId);
    });
  }

  return (
    <div>
      {/* Board count picker */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          marginBottom: "16px",
        }}
      >
        Boards tonight
        {playerCount > 0 && (
          <span style={{ marginLeft: "8px", color: "var(--ink-tertiary)" }}>
            · {playerCount} attending
          </span>
        )}
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {displayOptions.map((n) => {
          const active = boardCount === n;
          return (
            <button
              key={n}
              onClick={() => setBoardCount(n)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "12px 20px",
                border: active ? "1px solid var(--accent-primary)" : "1px solid var(--border-hairline)",
                backgroundColor: active ? "var(--accent-primary)" : "transparent",
                color: active ? "#ffffff" : "var(--ink-primary)",
                cursor: "pointer",
                minWidth: "72px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "2rem",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                {n}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? "rgba(255,255,255,0.7)" : "var(--ink-tertiary)",
                }}
              >
                {BOARD_LABELS.slice(0, n).join(", ")}
              </span>
            </button>
          );
        })}
      </div>

      {playerCount < 6 && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginBottom: "16px" }}>
          {playerCount === 0
            ? "No RSVP attendees yet — confirm player count before starting."
            : `${playerCount} attending — need at least 6 to run a full night.`}
        </p>
      )}

      <button
        onClick={handleStart}
        disabled={isPending}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          padding: "14px 28px",
          background: isPending ? "var(--ink-tertiary)" : "var(--accent-primary)",
          color: "#ffffff",
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          transition: "background 200ms ease",
        }}
      >
        {isPending ? "Starting…" : `Start Round 1 · ${boardCount} board${boardCount !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
