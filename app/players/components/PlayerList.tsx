"use client";

import { useState } from "react";
import type { Player } from "@/lib/db/schema";
import { AddPlayerForm } from "./AddPlayerForm";
import { EditPlayerDialog } from "./EditPlayerDialog";
import { DeletePlayerDialog } from "./DeletePlayerDialog";

interface Props {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  const [editing, setEditing] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);

  return (
    <div>
      <div className="mb-12">
        <AddPlayerForm />
      </div>

      {players.length === 0 ? (
        <p
          className="text-small uppercase tracking-widest"
          style={{ color: "var(--ink-tertiary)" }}
        >
          No players yet — add the first one above.
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: "var(--border-hairline)" }}
            >
              <th className="text-left text-meta uppercase tracking-widest pb-3 font-medium" style={{ color: "var(--ink-tertiary)" }}>
                Rank
              </th>
              <th className="text-left text-meta uppercase tracking-widest pb-3 font-medium" style={{ color: "var(--ink-tertiary)" }}>
                Name
              </th>
              <th className="text-right text-meta uppercase tracking-widest pb-3 font-medium" style={{ color: "var(--ink-tertiary)" }}>
                W
              </th>
              <th className="text-right text-meta uppercase tracking-widest pb-3 font-medium" style={{ color: "var(--ink-tertiary)" }}>
                L
              </th>
              <th className="text-right text-meta uppercase tracking-widest pb-3 font-medium" style={{ color: "var(--ink-tertiary)" }}>
                D
              </th>
              <th className="text-right text-meta uppercase tracking-widest pb-3 font-medium" style={{ color: "var(--ink-tertiary)" }}>
                D+W
              </th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.id}
                className="border-b group"
                style={{ borderColor: "var(--border-hairline)", height: "56px" }}
              >
                <td
                  className="text-meta font-mono py-3"
                  style={{ color: "var(--accent-gold)", fontFamily: "var(--font-jetbrains-mono)", width: "64px" }}
                >
                  {player.seasonRank}
                </td>
                <td
                  className="py-3 text-h3"
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem" }}
                >
                  {player.name}
                </td>
                <td className="text-right py-3 font-mono text-small" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-secondary)" }}>
                  {player.wins}
                </td>
                <td className="text-right py-3 font-mono text-small" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-secondary)" }}>
                  {player.losses}
                </td>
                <td className="text-right py-3 font-mono text-small" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-secondary)" }}>
                  {player.doves}
                </td>
                <td className="text-right py-3 font-mono text-small" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-secondary)" }}>
                  {player.doveWins}
                </td>
                <td className="text-right py-3">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-4">
                    <button
                      onClick={() => setEditing(player)}
                      className="text-meta uppercase tracking-widest cursor-pointer"
                      style={{ color: "var(--ink-tertiary)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleting(player)}
                      className="text-meta uppercase tracking-widest cursor-pointer"
                      style={{ color: "var(--ink-tertiary)" }}
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <EditPlayerDialog
          player={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeletePlayerDialog
          player={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
