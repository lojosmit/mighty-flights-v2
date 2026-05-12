"use client";

import { useScorekeeperStore, GRID_ROWS, type GridRow } from "@/store/scorekeeper";

const MARKS = ["", "/", "//", "///"] as const;

function CrossCell({
  count,
  onClick,
  disabled,
}: {
  count: 0 | 1 | 2 | 3;
  onClick: () => void;
  disabled: boolean;
}) {
  const complete = count === 3;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-16 text-center cursor-pointer disabled:cursor-default select-none"
      style={{
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: "1.1rem",
        color: complete ? "var(--accent-gold)" : "var(--ink-secondary)",
        fontWeight: complete ? 600 : 400,
      }}
    >
      {MARKS[count]}
    </button>
  );
}

export function ScoreGrid() {
  const { teamA, teamB, cycleCross, result } = useScorekeeperStore();
  const locked = result !== "in_progress";

  return (
    <table className="w-full" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr className="border-b" style={{ borderColor: "var(--border-hairline)" }}>
          <th
            className="text-center pb-3 text-meta uppercase tracking-widest font-medium w-16"
            style={{ color: "var(--ink-tertiary)" }}
          >
            {teamA.name}
          </th>
          <th className="pb-3 w-24" />
          <th
            className="text-center pb-3 text-meta uppercase tracking-widest font-medium w-16"
            style={{ color: "var(--ink-tertiary)" }}
          >
            {teamB.name}
          </th>
        </tr>
      </thead>
      <tbody>
        {GRID_ROWS.map((row: GridRow) => {
          const aCount = teamA.crosses[row];
          const bCount = teamB.crosses[row];
          const rowComplete = aCount === 3 && bCount === 3;

          return (
            <tr
              key={row}
              className="border-b"
              style={{
                borderColor: "var(--border-hairline)",
                height: "48px",
                position: "relative",
                ...(rowComplete
                  ? { backgroundImage: `linear-gradient(var(--accent-gold) 0%, var(--accent-gold) 100%)`, backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "center" }
                  : {}),
              }}
            >
              <td className="text-center py-1">
                <CrossCell
                  count={aCount}
                  onClick={() => cycleCross("A", row)}
                  disabled={locked}
                />
              </td>
              <td
                className="text-center py-1"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.25rem",
                  color: rowComplete ? "var(--accent-gold)" : "var(--ink-primary)",
                  opacity: rowComplete ? 0.5 : 1,
                  fontWeight: 500,
                  userSelect: "none",
                }}
              >
                {row}
              </td>
              <td className="text-center py-1">
                <CrossCell
                  count={bCount}
                  onClick={() => cycleCross("B", row)}
                  disabled={locked}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
