"use client";

import { useEffect } from "react";
import { useScorekeeperStore, type FixtureResult } from "@/store/scorekeeper";

interface Props {
  onDismiss: () => void;
}

function resultLabel(result: FixtureResult, teamA: string, teamB: string) {
  switch (result) {
    case "teamA_win":
    case "special_win_A":
      return teamA;
    case "teamB_win":
    case "special_win_B":
      return teamB;
    case "double_forfeit":
      return "Double Forfeit";
    default:
      return "";
  }
}

export function ResultModal({ onDismiss }: Props) {
  const { result, teamA, teamB } = useScorekeeperStore();
  const isDove = result === "special_win_A" || result === "special_win_B";
  const isForfeit = result === "double_forfeit";
  const winner = resultLabel(result, teamA.name, teamB.name);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: "var(--bg-primary)" }}
      onClick={onDismiss}
    >
      <div className="text-center px-12" style={{ maxWidth: "720px" }}>
        <p
          className="text-meta uppercase tracking-widest mb-6"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {isForfeit ? "No Result" : "Winner"}
        </p>

        <h1
          className="mb-8 animate-fade-in"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(3rem, 8vw, 6rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            color: "var(--ink-primary)",
          }}
        >
          {winner}
        </h1>

        {isDove && (
          <p
            className="text-h3 uppercase tracking-widest mb-8"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--accent-gold)",
              letterSpacing: "0.15em",
            }}
          >
            Special Win — Dove
          </p>
        )}

        {isForfeit && (
          <p
            className="text-body mb-8"
            style={{ color: "var(--ink-secondary)" }}
          >
            5 rounds without a bull — both teams receive a loss.
          </p>
        )}

        <div
          className="w-16 h-px mx-auto mb-8"
          style={{ backgroundColor: "var(--accent-gold)" }}
        />

        <button
          className="px-10 py-4 text-small uppercase tracking-widest font-medium cursor-pointer"
          style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        >
          Continue
        </button>

        <p
          className="mt-6 text-meta"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Dismisses automatically in 8 seconds
        </p>
      </div>
    </div>
  );
}
