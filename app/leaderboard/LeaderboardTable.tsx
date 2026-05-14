"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { sortLeaderboard, type LeaderboardEntry, type SortKey } from "@/lib/leaderboard-utils";

interface Props {
  entries: LeaderboardEntry[];
}

type Dir = "asc" | "desc";

type ColKey = keyof LeaderboardEntry;
const COLS: { key: ColKey; label: string }[] = [
  { key: "gamesPlayed", label: "GP"    },
  { key: "wins",        label: "W"     },
  { key: "losses",      label: "L"     },
  { key: "doves",       label: "D"     },
  { key: "doveWins",    label: "D+"    },
  { key: "winRatio",    label: "Ratio" },
];

const SORTABLE = new Set<SortKey>(["gamesPlayed", "wins", "doves", "doveWins", "winRatio"]);

export default function LeaderboardTable({ entries }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<Dir>("desc");

  const sorted = useMemo(
    () => sortLeaderboard(entries, sortKey, sortDir),
    [entries, sortKey, sortDir]
  );

  function handleSort(key: SortKey) {
    if (!SORTABLE.has(key)) return;
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    paddingBottom: "12px",
    textAlign: "right",
    whiteSpace: "nowrap",
  };

  return (
    <div className="mf-table-wrap">
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
          <th style={{ ...thStyle, textAlign: "left", width: "48px" }}>#</th>
          <th style={{ ...thStyle, textAlign: "left" }}>Player</th>

          {COLS.map(({ key, label }) => {
            const isSorted = key === sortKey;
            const canSort = SORTABLE.has(key as SortKey);
            return (
              <th
                key={key}
                style={{
                  ...thStyle,
                  color: isSorted ? "var(--accent-gold)" : "var(--ink-tertiary)",
                  cursor: canSort ? "pointer" : "default",
                  userSelect: "none",
                }}
                onClick={() => canSort && handleSort(key as SortKey)}
              >
                {label}
                {isSorted && (
                  <span style={{ marginLeft: "4px", fontSize: "9px" }}>
                    {sortDir === "desc" ? "▼" : "▲"}
                  </span>
                )}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {sorted.map((entry, i) => {
          const pos = i + 1;
          const isTop3 = pos <= 3;
          return (
            <tr
              key={entry.id}
              style={{
                height: "56px",
                borderBottom: "1px solid var(--border-hairline)",
                background: isTop3 ? "var(--bg-elevated)" : "transparent",
              }}
            >
              <td
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: isTop3 ? "var(--accent-gold)" : "var(--ink-tertiary)",
                  fontWeight: isTop3 ? 600 : 400,
                  width: "48px",
                }}
              >
                {pos}
              </td>

              <td style={{ paddingRight: "24px" }}>
                <Link
                  href={`/players/${entry.id}`}
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "22px",
                    fontWeight: 400,
                    color: "var(--ink-primary)",
                    textDecoration: "none",
                  }}
                >
                  {entry.name}
                </Link>
              </td>

              {COLS.map(({ key }) => {
                const val = entry[key as keyof LeaderboardEntry] as number;
                const display =
                  key === "winRatio"
                    ? val.toFixed(3)
                    : String(val);
                return (
                  <td
                    key={key}
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: key === sortKey ? "var(--ink-primary)" : "var(--ink-secondary)",
                    }}
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {sorted.length === 0 && (
          <tr>
            <td
              colSpan={COLS.length + 2}
              style={{
                paddingTop: "48px",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--ink-tertiary)",
                textAlign: "center",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              No players yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  );
}
