"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Player } from "@/lib/db/schema";
import { AddPlayerForm } from "./AddPlayerForm";
import { EditPlayerDialog } from "./EditPlayerDialog";
import { DeletePlayerDialog } from "./DeletePlayerDialog";

interface Props {
  players: Player[];
  canEdit?: boolean;
  clubId?: string | null;
}

export function PlayerList({ players, canEdit = false, clubId }: Props) {
  const [editing, setEditing] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? players.filter((p) => p.name.toLowerCase().includes(q)) : players;
  }, [players, search]);

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    paddingBottom: "12px",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div>
      {(canEdit || players.length > 6) && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
          {players.length > 6 && (
            <input
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: "1 1 200px",
                maxWidth: "360px",
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--ink-primary)",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-hairline)",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
          )}
          {canEdit && <AddPlayerForm clubId={clubId} />}
        </div>
      )}

      {players.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            textAlign: "center",
            paddingTop: "48px",
          }}
        >
          {canEdit ? "No players yet — add the first one above." : "No players in this club yet."}
        </p>
      ) : (
        <div className="mf-table-wrap">
          <table className="mf-player-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                <th style={{ ...thStyle, textAlign: "left", width: canEdit ? "36%" : "40%" }}>Name</th>
                <th style={{ ...thStyle, textAlign: "right", width: canEdit ? "10%" : "12%" }}>GP</th>
                <th style={{ ...thStyle, textAlign: "right", width: canEdit ? "10%" : "12%" }}>W</th>
                <th style={{ ...thStyle, textAlign: "right", width: canEdit ? "10%" : "12%" }}>L</th>
                <th className="mf-hide-mobile" style={{ ...thStyle, textAlign: "right", width: canEdit ? "9%" : "12%" }}>D</th>
                <th className="mf-hide-mobile" style={{ ...thStyle, textAlign: "right", width: canEdit ? "9%" : "12%" }}>D+W</th>
                {canEdit && <th style={{ ...thStyle, width: "16%", textAlign: "right" }} />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr
                  key={player.id}
                  style={{
                    height: "60px",
                    borderBottom: "1px solid var(--border-hairline)",
                  }}
                >
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Link
                      href={`/players/${player.id}`}
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "22px",
                        fontWeight: 400,
                        color: "var(--ink-primary)",
                        textDecoration: "none",
                      }}
                    >
                      {player.name}
                    </Link>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {player.wins + player.losses}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {player.wins}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {player.losses}
                  </td>
                  <td className="mf-hide-mobile" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {player.doves}
                  </td>
                  <td className="mf-hide-mobile" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {player.doveWins}
                  </td>
                  {canEdit && (
                    <td style={{ textAlign: "right" }}>
                      <span style={{ display: "inline-flex", gap: "12px" }}>
                        <button
                          onClick={() => setEditing(player)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            fontSize: "11px",
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(player)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            fontSize: "11px",
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          Del
                        </button>
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditPlayerDialog player={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <DeletePlayerDialog player={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
