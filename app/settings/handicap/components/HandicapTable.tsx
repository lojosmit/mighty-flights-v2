"use client";

import { useState, useTransition } from "react";
import type { HandicapSetting } from "@/lib/db/schema";
import { updateMultiplier } from "@/lib/handicap";

interface Props {
  rows: HandicapSetting[];
}

export function HandicapTable({ rows }: Props) {
  const [editing, setEditing] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEdit(row: HandicapSetting) {
    setEditing(row.id);
    setValue(parseFloat(row.multiplier).toFixed(2));
  }

  function handleSave(id: number) {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed <= 0) return;
    startTransition(async () => {
      await updateMultiplier(id, parsed);
      setEditing(null);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent, id: number) {
    if (e.key === "Enter") handleSave(id);
    if (e.key === "Escape") setEditing(null);
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--border-hairline)" }}>
            <th
              className="text-left text-meta uppercase tracking-widest pb-3 font-medium"
              style={{ color: "var(--ink-tertiary)" }}
            >
              Ranks
            </th>
            <th
              className="text-right text-meta uppercase tracking-widest pb-3 font-medium"
              style={{ color: "var(--ink-tertiary)" }}
            >
              Multiplier
            </th>
            <th className="pb-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b group"
              style={{ borderColor: "var(--border-hairline)", height: "56px" }}
            >
              <td
                className="py-3 text-body"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.1rem" }}
              >
                {row.rankFrom === row.rankTo
                  ? `Rank ${row.rankFrom}`
                  : `Ranks ${row.rankFrom} – ${row.rankTo}`}
              </td>
              <td className="text-right py-3">
                {editing === row.id ? (
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, row.id)}
                    onBlur={() => handleSave(row.id)}
                    autoFocus
                    disabled={isPending}
                    className="text-right bg-transparent border-b w-20 outline-none"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      borderColor: "var(--accent-gold)",
                      color: "var(--ink-primary)",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      color: "var(--accent-gold)",
                    }}
                  >
                    {parseFloat(row.multiplier).toFixed(2)}×
                  </span>
                )}
              </td>
              <td className="text-right py-3">
                {editing !== row.id && (
                  <button
                    onClick={() => startEdit(row)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-meta uppercase tracking-widest cursor-pointer"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-8 text-small" style={{ color: "var(--ink-tertiary)" }}>
        Ranks beyond this table follow the +0.1 per pair formula automatically.
      </p>
    </div>
  );
}
