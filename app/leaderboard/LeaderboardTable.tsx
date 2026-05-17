"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { sortLeaderboard, type LeaderboardEntry, type SortKey } from "@/lib/leaderboard-utils";

interface Props {
  entries: LeaderboardEntry[];
}

type Dir = "asc" | "desc";

type ColKey = keyof LeaderboardEntry;
const COLS: { key: ColKey; label: string; mobileHide?: boolean }[] = [
  { key: "gamesPlayed", label: "GP"    },
  { key: "wins",        label: "W"     },
  { key: "losses",      label: "L"     },
  { key: "doves",       label: "D",     mobileHide: true },
  { key: "doveWins",    label: "D+",    mobileHide: true },
  { key: "winRatio",    label: "Win %", mobileHide: true },
  { key: "totalPoints", label: "Pts"   },
];

const SORTABLE = new Set<SortKey>(["gamesPlayed", "wins", "winRatio", "totalPoints"]);

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
    padding: "0 16px 16px",
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

          {COLS.map(({ key, label, mobileHide }) => {
            const isSorted = key === sortKey;
            const canSort = SORTABLE.has(key as SortKey);
            return (
              <th
                key={key}
                className={mobileHide ? "mf-hide-mobile mf-leaderboard-cell" : "mf-leaderboard-cell"}
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
                height: "72px",
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
                  paddingLeft: "8px",
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

              {COLS.map(({ key, mobileHide }) => {
                const val = entry[key as keyof LeaderboardEntry] as number;
                let display: string;
                if (key === "winRatio") display = (val * 100).toFixed(1) + "%";
                else if (key === "totalPoints") display = val.toFixed(2);
                else display = String(val);
                return (
                  <td
                    key={key}
                    className={mobileHide ? "mf-hide-mobile mf-leaderboard-cell" : "mf-leaderboard-cell"}
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      padding: "0 16px",
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
