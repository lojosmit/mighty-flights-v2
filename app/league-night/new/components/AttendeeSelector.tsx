"use client";

import { useState, useMemo } from "react";
import type { Player } from "@/lib/db/schema";

interface Props {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function AttendeeSelector({ players, selected, onToggle }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? players.filter((p) => p.name.toLowerCase().includes(q)) : players;
  }, [players, search]);

  const allSelected = players.length > 0 && players.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allSelected) {
      players.forEach((p) => { if (selected.has(p.id)) onToggle(p.id); });
    } else {
      players.forEach((p) => { if (!selected.has(p.id)) onToggle(p.id); });
    }
  }

  return (
    <div>
      <div className="flex items-baseline gap-4 mb-6">
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}>
          Who is playing?
        </h2>
        <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
          {selected.size} selected
        </span>
      </div>

      {players.length > 0 && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "160px",
              padding: "8px 12px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ink-primary)",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-hairline)",
              outline: "none",
            }}
          />
          {/* Select all / none */}
          <button
            type="button"
            onClick={toggleAll}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-secondary)",
              background: "none",
              border: "1px solid var(--border-hairline)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      <div className="flex flex-col" style={{ maxWidth: "480px" }}>
        {filtered.map((player) => {
          const active = selected.has(player.id);
          return (
            <button
              key={player.id}
              onClick={() => onToggle(player.id)}
              className="flex items-center justify-between border-b py-4 text-left cursor-pointer group transition-colors"
              style={{ borderColor: "var(--border-hairline)", backgroundColor: active ? "var(--bg-elevated)" : "transparent" }}
            >
              <div className="flex items-center gap-4 px-4">
                <div
                  className="w-2 h-2 transition-opacity"
                  style={{ backgroundColor: "var(--accent-gold)", opacity: active ? 1 : 0 }}
                />
                <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem", color: active ? "var(--ink-primary)" : "var(--ink-secondary)" }}>
                  {player.name}
                </span>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && search && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)", padding: "16px 0" }}>
            No players match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {players.length === 0 && (
        <p className="text-body" style={{ color: "var(--ink-tertiary)" }}>
          No players in the roster yet. Add players first.
        </p>
      )}
    </div>
  );
}
