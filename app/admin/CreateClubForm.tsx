"use client";

import { useState, useTransition } from "react";
import { createClub } from "@/lib/clubs";
import { useRouter } from "next/navigation";

export default function CreateClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createClub(name, slug);
        setName("");
        setSlug("");
        router.refresh();
      } catch {
        setError("Slug already taken or invalid.");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "var(--ink-primary)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-hairline)",
    outline: "none",
    flex: 1,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: "160px" }}>
        <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "6px" }}>
          Club name
        </label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
          }}
          required
          style={inputStyle}
          placeholder="e.g. Mighty Flights"
        />
      </div>
      <div style={{ flex: 1, minWidth: "140px" }}>
        <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "6px" }}>
          Slug
        </label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          style={inputStyle}
          placeholder="e.g. mighty-flights"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "10px 24px",
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
        {isPending ? "Creating…" : "Create"}
      </button>
      {error && (
        <p style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--loss)" }}>{error}</p>
      )}
    </form>
  );
}
