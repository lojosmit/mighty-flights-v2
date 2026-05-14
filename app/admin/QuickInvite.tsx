"use client";

import { useState, useTransition } from "react";
import { createInviteToken } from "@/lib/invites";

interface Props {
  clubId: string;
}

export default function QuickInvite({ clubId }: Props) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setLink("");
    startTransition(async () => {
      const invite = await createInviteToken({ clubId, role: "player", ttlHours: 72 });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setLink(`${base}/register/${invite.token}`);
    });
  }

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (link) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--ink-secondary)",
            wordBreak: "break-all",
          }}
        >
          {link}
        </code>
        <button
          onClick={copy}
          style={{
            padding: "4px 10px",
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: copied ? "var(--accent-gold)" : "var(--ink-tertiary)",
            border: "1px solid var(--border-hairline)",
            background: "transparent",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={() => setLink("")}
          style={{
            padding: "4px 10px",
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={isPending}
      style={{
        padding: "4px 12px",
        fontFamily: "var(--font-body)",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--accent-gold)",
        border: "1px solid var(--accent-gold)",
        background: "transparent",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {isPending ? "…" : "Invite"}
    </button>
  );
}
