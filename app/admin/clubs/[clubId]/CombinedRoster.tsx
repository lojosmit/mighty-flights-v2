"use client";

import { useState, useTransition } from "react";
import type { Player, User, UserRole } from "@/lib/db/schema";
import ResetPasswordForm from "@/app/admin/ResetPasswordForm";
import { deleteUser, updateUserRole } from "@/lib/users";

export type RosterEntry = {
  name: string;
  email: string | null;
  player: Player | null;
  user: User | null;
};

interface Props {
  entries: RosterEntry[];
  viewerIsSuperAdmin?: boolean;
}

const BASE_ROLES: { value: Exclude<UserRole, "super_admin">; label: string }[] = [
  { value: "club_manager", label: "Club Manager" },
  { value: "host",         label: "Host" },
  { value: "player",       label: "Player" },
];

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  ...BASE_ROLES,
];

const selectStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-primary)",
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border-hairline)",
  padding: "4px 8px",
  cursor: "pointer",
  outline: "none",
};

export default function CombinedRoster({ entries: initial, viewerIsSuperAdmin = false }: Props) {
  const [entries, setEntries] = useState(initial);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = query
    ? entries.filter(
        (e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          (e.email ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : entries;

  function handleRoleChange(userId: string, newRole: UserRole) {
    startTransition(async () => {
      await updateUserRole(userId, newRole);
      setEntries((prev) =>
        prev.map((e) =>
          e.user?.id === userId ? { ...e, user: { ...e.user!, role: newRole } } : e
        )
      );
    });
  }

  function handleDelete(userId: string, name: string) {
    if (
      !confirm(
        `Remove ${name}? Their game history will be preserved, but their login account will be deleted.`
      )
    )
      return;
    startTransition(async () => {
      await deleteUser(userId);
      setEntries((prev) =>
        prev.map((e) => (e.user?.id === userId ? { ...e, user: null } : e))
      );
    });
  }

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 150ms" }}>
      {entries.length > 6 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--ink-primary)",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-hairline)",
            outline: "none",
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((entry) => {
          const key = entry.user?.id ?? entry.player?.id ?? entry.name;
          const { name, email, player, user } = entry;
          const gamesPlayed = player ? player.wins + player.losses : null;

          return (
            <div
              key={key}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid var(--border-hairline)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* Left: name + email + brief stats */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "20px",
                    color: "var(--ink-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "baseline",
                    marginTop: "3px",
                    flexWrap: "wrap",
                  }}
                >
                  {email && (
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      {email}
                    </span>
                  )}
                  {gamesPlayed !== null && gamesPlayed > 0 && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      {player!.wins}W · {player!.losses}L
                    </span>
                  )}
                </div>
              </div>

              {/* Right: role controls or no-account badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  flexShrink: 0,
                }}
              >
                {user ? (
                  <>
                    {user.role === "super_admin" && !viewerIsSuperAdmin ? (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--accent-gold)",
                        }}
                      >
                        super_admin
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        disabled={pending}
                        style={selectStyle}
                      >
                        {(viewerIsSuperAdmin ? ALL_ROLES : BASE_ROLES).map(
                          ({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    )}
                    <ResetPasswordForm userId={user.id} />
                    {user.role !== "super_admin" && (
                      <button
                        onClick={() => handleDelete(user.id, name)}
                        disabled={pending}
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          fontWeight: 500,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--loss)",
                          background: "none",
                          border: "1px solid var(--loss)",
                          padding: "4px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--accent-gold)",
                    }}
                  >
                    No account
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--ink-tertiary)",
              paddingTop: "16px",
            }}
          >
            {query ? "No players match your search." : "No players yet."}
          </p>
        )}
      </div>
    </div>
  );
}
