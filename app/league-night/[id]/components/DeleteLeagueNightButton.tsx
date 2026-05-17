"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLeagueNight } from "@/lib/league-nights";

export default function DeleteLeagueNightButton({ nightId }: { nightId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteLeagueNight(nightId);
      router.push("/admin");
    });
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };

  const btnBase: React.CSSProperties = {
    ...labelStyle,
    border: "1px solid currentColor",
    cursor: isPending ? "not-allowed" : "pointer",
    opacity: isPending ? 0.5 : 1,
    padding: "8px 16px",
    background: "transparent",
    transition: "opacity 120ms ease",
  };

  return (
    <div
      style={{
        marginTop: "40px",
        paddingTop: "24px",
        borderTop: "1px solid var(--border-hairline)",
      }}
    >
      <p style={{ ...labelStyle, color: "var(--ink-tertiary)", marginBottom: "12px" }}>
        Danger Zone
      </p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{ ...btnBase, color: "#c0392b" }}
        >
          Delete Game Night
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <p style={{ ...labelStyle, color: "#c0392b" }}>
            {isPending ? "Deleting…" : "This will wipe all rounds, results, and reverse player stats. Are you sure?"}
          </p>
          {!isPending && (
            <>
              <button
                onClick={handleDelete}
                style={{ ...btnBase, color: "#c0392b", borderColor: "#c0392b" }}
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{ ...btnBase, color: "var(--ink-tertiary)", borderColor: "var(--border-hairline)" }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
