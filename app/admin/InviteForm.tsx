"use client";

import { useState, useTransition } from "react";
import { createInviteToken } from "@/lib/invites";
import type { UserRole } from "@/lib/db/schema";

type InviteRole = Exclude<UserRole, "super_admin">;

export default function InviteForm({ clubId }: { clubId: string }) {
  const [role, setRole] = useState<InviteRole>("player");
  const [ttl, setTtl] = useState(72);
  const [link, setLink] = useState("");
  const [isPending, startTransition] = useTransition();

  function generate() {
    setLink("");
    startTransition(async () => {
      const invite = await createInviteToken({ clubId, role, ttlHours: ttl });
      const url = `${window.location.origin}/register/${invite.token}`;
      setLink(url);
    });
  }

  const selectStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "var(--ink-primary)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-hairline)",
    outline: "none",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <select value={role} onChange={(e) => setRole(e.target.value as InviteRole)} style={selectStyle}>
          <option value="player">Player</option>
          <option value="host">Host</option>
          <option value="club_manager">Club Manager</option>
        </select>
        <select value={ttl} onChange={(e) => setTtl(Number(e.target.value))} style={selectStyle}>
          <option value={24}>24 hours</option>
          <option value={72}>3 days</option>
          <option value={168}>7 days</option>
          <option value={720}>30 days</option>
        </select>
        <button
          onClick={generate}
          disabled={isPending}
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--accent-primary)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Generating…" : "Generate link"}
        </button>
      </div>

      {link && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            readOnly
            value={link}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--ink-secondary)",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-hairline)",
              outline: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            style={{
              padding: "8px 14px",
              backgroundColor: "transparent",
              color: "var(--accent-gold)",
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1px solid var(--accent-gold)",
              cursor: "pointer",
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
