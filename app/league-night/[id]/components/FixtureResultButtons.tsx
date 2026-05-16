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
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.45,
    border: "none",
    transition: "opacity 120ms ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "0 8px",
    width: "100%",
  };

  const rowLabel: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-hairline)",
        paddingTop: "20px",
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {isPending && (
        <p style={{ ...rowLabel, color: "var(--ink-tertiary)" }}>Saving…</p>
      )}

      {/* ── Win row ── */}
      <div>
        <p style={rowLabel}>Win</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            onClick={() => enabled && onResult("teamA_win")}
            style={{
              ...base,
              minHeight: "60px",
              background: "var(--accent-primary)",
              color: "#ffffff",
              fontSize: "13px",
              borderRadius: "4px",
            }}
          >
            <span>{teamALabel}</span>
          </button>
          <button
            onClick={() => enabled && onResult("teamB_win")}
            style={{
              ...base,
              minHeight: "60px",
              background: "var(--bg-elevated)",
              color: "var(--ink-primary)",
              border: "1px solid var(--border-hairline)",
              fontSize: "13px",
              borderRadius: "4px",
            }}
          >
            <span>{teamBLabel}</span>
          </button>
        </div>
      </div>

      {/* ── Dove row ── */}
      <div>
        <p style={rowLabel}>Win + Dove bonus point</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            onClick={() => enabled && onResult("special_win_A")}
            style={{
              ...base,
              minHeight: "60px",
              background: "transparent",
              color: "var(--accent-gold)",
              border: "1px solid var(--accent-gold)",
              fontSize: "12px",
              borderRadius: "4px",
            }}
          >
            <span>{teamALabel}</span>
            <span style={{ fontSize: "10px", letterSpacing: "0.1em", opacity: 0.8 }}>+ dove</span>
          </button>
          <button
            onClick={() => enabled && onResult("special_win_B")}
            style={{
              ...base,
              minHeight: "60px",
              background: "transparent",
              color: "var(--accent-gold)",
              border: "1px solid var(--accent-gold)",
              fontSize: "12px",
              borderRadius: "4px",
            }}
          >
            <span>{teamBLabel}</span>
            <span style={{ fontSize: "10px", letterSpacing: "0.1em", opacity: 0.8 }}>+ dove</span>
          </button>
        </div>
      </div>

      {/* ── Forfeit ── */}
      <button
        onClick={() => enabled && onResult("double_forfeit")}
        style={{
          ...base,
          minHeight: "40px",
          flexDirection: "row",
          background: "transparent",
          color: "var(--ink-tertiary)",
          border: "1px solid var(--border-hairline)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          borderRadius: "4px",
        }}
      >
        Double Forfeit
      </button>
    </div>
  );
}
