"use client";

import type { FixtureResult } from "@/lib/db/schema";

interface Props {
  teamALabel: string;
  teamBLabel: string;
  onResult: (result: FixtureResult) => void;
  isPending?: boolean;
}

const btn = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "8px 16px",
  cursor: active ? "pointer" : "not-allowed",
  opacity: active ? 1 : 0.45,
  border: "1px solid var(--border-hairline)",
  background: "transparent",
  color: "var(--ink-secondary)",
  transition: "border-color 120ms ease, color 120ms ease",
  whiteSpace: "nowrap" as const,
});

const primaryBtn = (active: boolean): React.CSSProperties => ({
  ...btn(active),
  background: "var(--accent-primary)",
  border: "1px solid var(--accent-primary)",
  color: "#ffffff",
});

const goldBtn = (active: boolean): React.CSSProperties => ({
  ...btn(active),
  border: "1px solid var(--accent-gold)",
  color: "var(--accent-gold)",
});

export default function FixtureResultButtons({
  teamALabel,
  teamBLabel,
  onResult,
  isPending = false,
}: Props) {
  const enabled = !isPending;

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-hairline)",
        paddingTop: "20px",
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {isPending && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
          Saving…
        </p>
      )}
      {/* Win buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => enabled && onResult("teamA_win")}
          style={primaryBtn(enabled)}
        >
          {teamALabel} wins
        </button>
        <button
          onClick={() => enabled && onResult("teamB_win")}
          style={{ ...primaryBtn(enabled), background: "transparent", border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}
        >
          {teamBLabel} wins
        </button>
      </div>

      {/* Dove (special win) buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => enabled && onResult("special_win_A")}
          style={goldBtn(enabled)}
        >
          {teamALabel} — dove
        </button>
        <button
          onClick={() => enabled && onResult("special_win_B")}
          style={goldBtn(enabled)}
        >
          {teamBLabel} — dove
        </button>
      </div>

      {/* Forfeit */}
      <div>
        <button
          onClick={() => enabled && onResult("double_forfeit")}
          style={btn(enabled)}
        >
          Double forfeit
        </button>
      </div>
    </div>
  );
}
