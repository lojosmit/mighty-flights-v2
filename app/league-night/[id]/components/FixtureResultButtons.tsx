"use client";

import type { FixtureResult } from "@/lib/db/schema";

interface Props {
  teamALabel: string;
  teamBLabel: string;
  onResult: (result: FixtureResult) => void;
  isPending?: boolean;
}

export default function FixtureResultButtons({
  teamALabel,
  teamBLabel,
  onResult,
  isPending = false,
}: Props) {
  const enabled = !isPending;

  const base: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.45,
    border: "none",
    transition: "opacity 120ms ease, transform 80ms ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    minHeight: "68px",
    width: "100%",
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-hairline)",
        paddingTop: "20px",
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {isPending && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "4px" }}>
          Saving…
        </p>
      )}

      {/* Win buttons — full width, split 50/50 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          onClick={() => enabled && onResult("teamA_win")}
          style={{
            ...base,
            background: "var(--accent-primary)",
            color: "#ffffff",
          }}
        >
          {teamALabel} wins
        </button>
        <button
          onClick={() => enabled && onResult("teamB_win")}
          style={{
            ...base,
            background: "var(--bg-elevated)",
            color: "var(--ink-primary)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          {teamBLabel} wins
        </button>
      </div>

      {/* Dove buttons — gold outline, same grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          onClick={() => enabled && onResult("special_win_A")}
          style={{
            ...base,
            minHeight: "52px",
            background: "transparent",
            color: "var(--accent-gold)",
            border: "1px solid var(--accent-gold)",
            fontSize: "12px",
          }}
        >
          {teamALabel} — dove
        </button>
        <button
          onClick={() => enabled && onResult("special_win_B")}
          style={{
            ...base,
            minHeight: "52px",
            background: "transparent",
            color: "var(--accent-gold)",
            border: "1px solid var(--accent-gold)",
            fontSize: "12px",
          }}
        >
          {teamBLabel} — dove
        </button>
      </div>

      {/* Forfeit — full width, tertiary */}
      <button
        onClick={() => enabled && onResult("double_forfeit")}
        style={{
          ...base,
          minHeight: "40px",
          background: "transparent",
          color: "var(--ink-tertiary)",
          border: "1px solid var(--border-hairline)",
          fontSize: "11px",
          letterSpacing: "0.1em",
        }}
      >
        Double Forfeit
      </button>
    </div>
  );
}
