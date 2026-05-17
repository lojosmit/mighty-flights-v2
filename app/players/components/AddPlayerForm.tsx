"use client";

import { useState, useTransition } from "react";
import { createPlayer } from "@/lib/players";

export function AddPlayerForm({ clubId }: { clubId?: string | null }) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createPlayer({ name: trimmed }, clubId);
      setName("");
    });
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    display: "block",
    marginBottom: "8px",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "360px" }}>
      <div>
        <label style={labelStyle}>Player name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          style={{
            width: "100%",
            padding: "10px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--ink-primary)",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-hairline)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "12px 24px",
          backgroundColor: isPending ? "var(--ink-tertiary)" : "var(--accent-primary)",
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {isPending ? "Adding…" : "Add Player"}
      </button>
    </form>
  );
}
