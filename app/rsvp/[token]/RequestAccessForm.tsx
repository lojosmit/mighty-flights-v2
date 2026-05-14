"use client";

import { useState, useTransition } from "react";
import { createRegistrationRequest } from "@/lib/registration-requests";

interface Props {
  leagueNightId: string;
  clubId?: string;
}

export default function RequestAccessForm({ leagueNightId, clubId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    color: "var(--ink-primary)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-hairline)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    marginBottom: "6px",
    textAlign: "left",
  };

  if (done) {
    return (
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--accent-gold)", fontWeight: 500, marginBottom: "8px" }}>
          Request sent.
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
          The admin will send you a registration link.
        </p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "left" }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)", marginBottom: "24px", textAlign: "center" }}>
        You need an account to RSVP. Enter your details and the admin will send you a registration link.
      </p>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          required
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />
      </div>

      <button
        disabled={isPending || !name.trim() || !email.trim()}
        onClick={() =>
          startTransition(async () => {
            await createRegistrationRequest({ name: name.trim(), email: email.trim(), leagueNightId, clubId });
            setDone(true);
          })
        }
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: isPending ? "var(--ink-tertiary)" : "var(--accent-primary)",
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
        {isPending ? "Sending…" : "Request Access"}
      </button>
    </div>
  );
}
