"use client";

import { useState } from "react";
import type { User } from "@/lib/db/schema";
import ResetPasswordForm from "@/app/admin/ResetPasswordForm";

interface Props {
  members: User[];
}

export default function SearchableMembers({ members }: Props) {
  const [query, setQuery] = useState("");

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    paddingBottom: "10px",
    textAlign: "left",
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        style={{
          width: "100%",
          maxWidth: "360px",
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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Role</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Reset Password</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} style={{ height: "52px", borderBottom: "1px solid var(--border-hairline)" }}>
                <td>
                  <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "var(--ink-primary)" }}>
                    {m.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    {m.email}
                  </div>
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-secondary)" }}>
                  {m.role}
                </td>
                <td style={{ textAlign: "right" }}>
                  <ResetPasswordForm userId={m.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
