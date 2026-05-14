"use client";

import { useState, useTransition } from "react";
import { updateUserPassword } from "@/lib/users";

export default function ResetPasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "4px 10px",
          backgroundColor: "transparent",
          color: "var(--ink-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          border: "1px solid var(--border-hairline)",
          cursor: "pointer",
        }}
      >
        Reset
      </button>
    );
  }

  if (done) {
    return (
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--accent-gold)" }}>
        Password updated
      </span>
    );
  }

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        style={{
          padding: "4px 8px",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--ink-primary)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-hairline)",
          outline: "none",
          width: "140px",
        }}
      />
      <button
        onClick={() =>
          startTransition(async () => {
            if (password.length < 8) return;
            await updateUserPassword(userId, password);
            setDone(true);
          })
        }
        disabled={isPending || password.length < 8}
        style={{
          padding: "4px 10px",
          backgroundColor: "var(--accent-primary)",
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        Save
      </button>
      <button
        onClick={() => { setOpen(false); setPassword(""); }}
        style={{
          padding: "4px 8px",
          backgroundColor: "transparent",
          color: "var(--ink-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          border: "1px solid var(--border-hairline)",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
