"use client";

import type { Player } from "@/lib/db/schema";

interface Props {
  players: Player[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function AttendeeSelector({ players, selected, onToggle }: Props) {
  return (
    <div>
      <div className="flex items-baseline gap-4 mb-6">
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "1.75rem",
            color: "var(--ink-primary)",
          }}
        >
          Who is playing tonight?
        </h2>
        <span
          className="text-meta uppercase tracking-widest"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {selected.size} selected
        </span>
      </div>

      <div className="flex flex-col" style={{ maxWidth: "480px" }}>
        {players.map((player) => {
          const active = selected.has(player.id);
          return (
            <button
              key={player.id}
              onClick={() => onToggle(player.id)}
              className="flex items-center justify-between border-b py-4 text-left cursor-pointer group transition-colors"
              style={{
                borderColor: "var(--border-hairline)",
                backgroundColor: active ? "var(--bg-elevated)" : "transparent",
              }}
            >
              <div className="flex items-center gap-4 px-4">
                {/* Active indicator — gold square per UIUX.md */}
                <div
                  className="w-2 h-2 transition-opacity"
                  style={{
                    backgroundColor: "var(--accent-gold)",
                    opacity: active ? 1 : 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.2rem",
                    color: active ? "var(--ink-primary)" : "var(--ink-secondary)",
                  }}
                >
                  {player.name}
                </span>
              </div>
              <span
                className="text-meta uppercase tracking-widest pr-4"
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: "var(--ink-tertiary)",
                }}
              >
                Rank {player.seasonRank}
              </span>
            </button>
          );
        })}
      </div>

      {players.length === 0 && (
        <p className="text-body" style={{ color: "var(--ink-tertiary)" }}>
          No players in the roster yet. Add players first.
        </p>
      )}
    </div>
  );
}
