"use client";

import { useState } from "react";
import { useScorekeeperStore, finalScore } from "@/store/scorekeeper";
import { ScoreGrid } from "./components/ScoreGrid";
import { Timer } from "./components/Timer";
import { ResultModal } from "./components/ResultModal";

function TeamPanel({ team }: { team: "A" | "B" }) {
  const store = useScorekeeperStore();
  const t = team === "A" ? store.teamA : store.teamB;
  const locked = store.result !== "in_progress";
  const computed = finalScore(t);

  return (
    <div className="flex flex-col gap-4">
      {/* Team name */}
      <input
        type="text"
        value={t.name}
        onChange={(e) => store.setTeamName(team, e.target.value)}
        disabled={locked}
        className="bg-transparent border-b text-h3 outline-none w-full pb-1"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.5rem",
          borderColor: "var(--border-hairline)",
          color: "var(--ink-primary)",
        }}
      />

      {/* Score input */}
      <div className="flex flex-col gap-1">
        <label className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
          Score
        </label>
        <input
          type="number"
          min={0}
          value={t.score}
          onChange={(e) => store.setScore(team, parseFloat(e.target.value) || 0)}
          disabled={locked}
          className="bg-transparent border-b outline-none w-24 pb-1"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "1.5rem",
            borderColor: "var(--border-hairline)",
            color: "var(--ink-primary)",
          }}
        />
      </div>

      {/* Handicap */}
      <div className="flex flex-col gap-1">
        <label className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
          Handicap ×
        </label>
        <input
          type="number"
          min={1}
          step={0.1}
          value={t.handicap}
          onChange={(e) => store.setHandicap(team, parseFloat(e.target.value) || 1)}
          disabled={locked}
          className="bg-transparent border-b outline-none w-20 pb-1"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "1rem",
            borderColor: "var(--border-hairline)",
            color: "var(--ink-secondary)",
          }}
        />
      </div>

      {/* Final score */}
      <div className="flex flex-col gap-1">
        <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
          Final
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "2rem",
            color: "var(--accent-gold)",
          }}
        >
          {computed}
        </span>
        {t.specialWin && (
          <span className="text-meta uppercase tracking-widest" style={{ color: "var(--accent-gold)" }}>
            + 1 Special Win
          </span>
        )}
      </div>

      {/* Special win toggle */}
      <button
        onClick={() => store.toggleSpecialWin(team)}
        disabled={locked}
        className="text-left text-meta uppercase tracking-widest cursor-pointer disabled:opacity-40 py-2"
        style={{
          color: t.specialWin ? "var(--accent-gold)" : "var(--ink-tertiary)",
          borderBottom: t.specialWin ? "1px solid var(--accent-gold)" : "1px solid transparent",
        }}
      >
        {t.specialWin ? "★ Special Win" : "Special Win"}
      </button>
    </div>
  );
}

export default function ScorekeeperPage() {
  const { result, setResult, reset } = useScorekeeperStore();
  const [showModal, setShowModal] = useState(false);
  const locked = result !== "in_progress";

  function handleResult(r: typeof result) {
    setResult(r);
    setShowModal(true);
  }

  function handleDismiss() {
    setShowModal(false);
  }

  return (
    <main className="mf-page">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <p className="text-meta uppercase tracking-widest mb-2" style={{ color: "var(--ink-tertiary)" }}>
            Scorekeeper
          </p>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.5rem", color: "var(--ink-primary)" }}>
            Standalone Game
          </h1>
        </div>
        <Timer />
      </div>

      <div className="h-px w-full mb-12" style={{ backgroundColor: "var(--border-hairline)" }} />

      {/* Three-column layout: Team A | Grid | Team B */}
      <div className="grid gap-12" style={{ gridTemplateColumns: "240px 1fr 240px" }}>
        <TeamPanel team="A" />
        <ScoreGrid />
        <TeamPanel team="B" />
      </div>

      {/* Result buttons */}
      {!locked && (
        <div
          className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-5"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-hairline)",
          }}
        >
          <span className="text-meta uppercase tracking-widest mr-4" style={{ color: "var(--ink-tertiary)" }}>
            Record result:
          </span>
          <button
            onClick={() => handleResult("teamA_win")}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
            style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
          >
            Team A Wins
          </button>
          <button
            onClick={() => handleResult("teamB_win")}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
            style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
          >
            Team B Wins
          </button>
          <button
            onClick={() => handleResult("special_win_A")}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
            style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)" }}
          >
            A Special Win
          </button>
          <button
            onClick={() => handleResult("special_win_B")}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
            style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)" }}
          >
            B Special Win
          </button>
          <button
            onClick={() => handleResult("double_forfeit")}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
            style={{ border: "1px solid var(--ink-tertiary)", color: "var(--ink-tertiary)" }}
          >
            Double Forfeit
          </button>
        </div>
      )}

      {/* Locked state — reset option */}
      {locked && (
        <div
          className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-5"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-hairline)",
          }}
        >
          <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
            Game complete
          </span>
          <button
            onClick={reset}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
            style={{ border: "1px solid var(--ink-primary)", color: "var(--ink-primary)" }}
          >
            New Game
          </button>
        </div>
      )}

      {showModal && <ResultModal onDismiss={handleDismiss} />}
    </main>
  );
}
