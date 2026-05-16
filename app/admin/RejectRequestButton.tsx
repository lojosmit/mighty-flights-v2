"use client";

import { useState, useTransition } from "react";
import { rejectRegistrationRequest } from "@/lib/registration-requests";

export default function RejectRequestButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)" }}>
          Reject?
        </span>
        <button
          onClick={() =>
            startTransition(async () => {
              await rejectRegistrationRequest(id);
            })
          }
          disabled={isPending}
          style={{
            background: "none",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--loss)",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
          }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmed(true)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--ink-tertiary)",
      }}
    >
      Reject
    </button>
  );
}
