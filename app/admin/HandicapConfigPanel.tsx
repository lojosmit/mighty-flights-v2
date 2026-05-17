"use client";

import { useState, useMemo, useTransition } from "react";
import { regenerateHandicapTable } from "./handicap-actions";
import type { HandicapSetting } from "@/lib/db/schema";

interface Props {
  current: HandicapSetting[];
}

const MAX_RANK = 20;

function buildRows(base: number, inc: number, interval: number) {
  const rows: { rankFrom: number; rankTo: number; multiplier: string }[] = [];
  for (let tier = 0; tier * interval < MAX_RANK; tier++) {
    const rankFrom = tier * interval + 1;
    const rankTo = Math.min((tier + 1) * interval, MAX_RANK);
    rows.push({ rankFrom, rankTo, multiplier: (base + tier * inc).toFixed(2) });
  }
  return rows;
}

export default function HandicapConfigPanel({ current }: Props) {
  const [base, setBase] = useState("1.00");
  const [increment, setIncrement] = useState("0.10");
  const [interval, setInterval] = useState("2");
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);

  const preview = useMemo(
    () => buildRows(parseFloat(base) || 1, parseFloat(increment) || 0.1, parseInt(interval) || 1),
    [base, increment, interval],
  );

  function handleApply() {
    setApplied(false);
    startTransition(async () => {
      await regenerateHandicapTable(
        parseFloat(base) || 1,
        parseFloat(increment) || 0.1,
        parseInt(interval) || 1,
      );
      setApplied(true);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "80px",
    padding: "8px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    color: "var(--ink-primary)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-hairline)",
    outline: "none",
    textAlign: "right",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    display: "block",
    marginBottom: "6px",
  };

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    textAlign: "left",
    paddingBottom: "10px",
    paddingRight: "32px",
  };

  return (
    <div className="mf-grid-2" style={{ alignItems: "start", gap: "48px" }}>

      {/* Left: formula inputs */}
      <div>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", marginBottom: "32px" }}>
          <div>
            <label style={labelStyle}>Base multiplier</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={base}
              onChange={(e) => { setApplied(false); setBase(e.target.value); }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Increment</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={increment}
              onChange={(e) => { setApplied(false); setIncrement(e.target.value); }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Every N ranks</label>
            <input
              type="number"
              step="1"
              min="1"
              max="20"
              value={interval}
              onChange={(e) => { setApplied(false); setInterval(e.target.value); }}
              style={inputStyle}
            />
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", marginBottom: "24px", lineHeight: 1.6 }}>
          Formula: <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-secondary)" }}>
            multiplier = {base || "1.00"} + floor((rank − 1) ÷ {interval || "1"}) × {increment || "0.10"}
          </span>
        </p>

        <button
          onClick={handleApply}
          disabled={isPending}
          style={{
            padding: "12px 28px",
            backgroundColor: isPending ? "var(--ink-tertiary)" : "var(--accent-primary)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Applying…" : "Apply to all ranks"}
        </button>

        {applied && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent-gold)", marginTop: "12px" }}>
            Handicap table updated.
          </p>
        )}
      </div>

      {/* Right: preview + current side by side */}
      <div className="mf-grid-2" style={{ gap: "32px" }}>

        {/* Preview */}
        <div>
          <p style={{ ...labelStyle, marginBottom: "12px" }}>Preview</p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                <th style={thStyle}>Ranks</th>
                <th style={{ ...thStyle, textAlign: "right", paddingRight: 0 }}>×</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.rankFrom} style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)", padding: "8px 32px 8px 0" }}>
                    {row.rankFrom === row.rankTo ? `${row.rankFrom}` : `${row.rankFrom}–${row.rankTo}`}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-primary)", textAlign: "right" }}>
                    {row.multiplier}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Current active table */}
        <div>
          <p style={{ ...labelStyle, marginBottom: "12px" }}>Active</p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                <th style={thStyle}>Ranks</th>
                <th style={{ ...thStyle, textAlign: "right", paddingRight: 0 }}>×</th>
              </tr>
            </thead>
            <tbody>
              {current.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)", padding: "8px 32px 8px 0" }}>
                    {row.rankFrom === row.rankTo ? `${row.rankFrom}` : `${row.rankFrom}–${row.rankTo}`}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-primary)", textAlign: "right" }}>
                    {parseFloat(row.multiplier).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
