"use client";

import { useState, useTransition } from "react";
import type { User, UserRole } from "@/lib/db/schema";
import ResetPasswordForm from "@/app/admin/ResetPasswordForm";
import { deleteUser, updateUserRole } from "@/lib/users";

interface Props {
  members: User[];
}

const ASSIGNABLE_ROLES: { value: Exclude<UserRole, "super_admin">; label: string }[] = [
  { value: "club_manager", label: "Club Manager" },
  { value: "host",         label: "Host" },
  { value: "player",       label: "Player" },
];

const inputStyle: React.CSSProperties = {
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

export default function SearchableMembers({ members: initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  function handleRoleChange(userId: string, newRole: UserRole) {
    startTransition(async () => {
      await updateUserRole(userId, newRole);
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
    });
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`Remove ${name}? Their game history will be preserved, but their login account will be deleted.`)) return;
    startTransition(async () => {
      await deleteUser(userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    });
  }

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 150ms" }}>
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

      {filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
          {query ? "No members match your search." : "No members yet."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((m) => (
            <div
              key={m.id}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid var(--border-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Name + email */}
              <div>
                <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", color: "var(--ink-primary)", lineHeight: 1.2 }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                  {m.email}
                </div>
              </div>

              {/* Controls row */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {/* Role selector */}
                {m.role !== "super_admin" ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                    style={inputStyle}
                    disabled={pending}
                  >
                    {ASSIGNABLE_ROLES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-gold)" }}>
                    super_admin
                  </span>
                )}

                {/* Reset password */}
                <ResetPasswordForm userId={m.id} />

                {/* Delete */}
                {m.role !== "super_admin" && (
                  <button
                    onClick={() => handleDelete(m.id, m.name)}
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
                      opacity: pending ? 0.4 : 1,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
