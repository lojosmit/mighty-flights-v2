"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "@/lib/rsvp";
import { useRouter } from "next/navigation";

export default function RsvpButton({
  leagueNightId,
  userId,
}: {
  leagueNightId: string;
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleRsvp() {
    startTransition(async () => {
      await submitRsvp(leagueNightId, userId);
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--accent-gold)", fontWeight: 500 }}>
        You&apos;re in for this night.
      </p>
    );
  }

  return (
    <button
      onClick={handleRsvp}
      disabled={isPending}
      style={{
        padding: "14px 48px",
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
      {isPending ? "Confirming…" : "Confirm attendance"}
    </button>
  );
}
