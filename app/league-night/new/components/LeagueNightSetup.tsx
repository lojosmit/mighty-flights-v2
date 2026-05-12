"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Player } from "@/lib/db/schema";
import { createLeagueNight } from "@/lib/league-nights";
import { canRunLeagueNight, maxBoards } from "@/lib/league-night-utils";
import { AttendeeSelector } from "./AttendeeSelector";
import { BoardCountPicker } from "./BoardCountPicker";

type Step = 1 | 2 | 3;

interface Props {
  players: Player[];
}

export function LeagueNightSetup({ players }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [boardCount, setBoardCount] = useState(1);
  const [isPending, startTransition] = useTransition();

  const playerCount = selected.size;
  const canProceed = canRunLeagueNight(playerCount);
  const max = maxBoards(playerCount);

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Reset board count if it exceeds new max
    setBoardCount((prev) => Math.min(prev, Math.max(1, maxBoards(selected.size))));
  }

  function goToStep2() {
    setBoardCount(1);
    setStep(2);
  }

  function handleConfirm() {
    startTransition(async () => {
      const night = await createLeagueNight(Array.from(selected), boardCount);
      router.push(`/league-night/${night.id}`);
    });
  }

  const selectedPlayers = players.filter((p) => selected.has(p.id));

  return (
    <div>
      {/* Step indicators */}
      <div className="flex gap-8 mb-12">
        {(["Attendees", "Boards", "Confirm"] as const).map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-6 h-6 flex items-center justify-center text-meta font-medium"
                style={{
                  backgroundColor: active || done ? "var(--accent-primary)" : "transparent",
                  border: active || done ? "none" : "1px solid var(--border-hairline)",
                  color: active || done ? "#FFFFFF" : "var(--ink-tertiary)",
                  fontSize: "0.7rem",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span
                className="text-meta uppercase tracking-widest"
                style={{ color: active ? "var(--ink-primary)" : "var(--ink-tertiary)" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1 — Attendees */}
      {step === 1 && (
        <div>
          <AttendeeSelector
            players={players}
            selected={selected}
            onToggle={togglePlayer}
          />

          <div className="mt-10 flex items-center gap-6">
            <button
              onClick={goToStep2}
              disabled={!canProceed}
              className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
            >
              Choose Boards
            </button>
            {playerCount > 0 && !canProceed && (
              <p className="text-small" style={{ color: "var(--ink-tertiary)" }}>
                Need at least 6 players to start a league night.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Board count */}
      {step === 2 && (
        <div>
          <BoardCountPicker
            playerCount={playerCount}
            selected={boardCount}
            onSelect={setBoardCount}
          />

          <div className="mt-10 flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
              style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
            >
              Review
            </button>
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
              style={{ border: "1px solid var(--ink-primary)", color: "var(--ink-primary)" }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div style={{ maxWidth: "480px" }}>
          <h2
            className="mb-8"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.75rem",
              color: "var(--ink-primary)",
            }}
          >
            Confirm and start
          </h2>

          <div
            className="p-8 mb-8"
            style={{
              border: "1px solid var(--border-hairline)",
              backgroundColor: "var(--bg-elevated)",
            }}
          >
            <div className="flex justify-between mb-6">
              <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
                Players
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: "var(--accent-gold)",
                }}
              >
                {playerCount}
              </span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
                Boards
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: "var(--accent-gold)",
                }}
              >
                {boardCount}
              </span>
            </div>
            <div
              className="border-t pt-4"
              style={{ borderColor: "var(--border-hairline)" }}
            >
              <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
                Attending
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="text-small px-2 py-1"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1rem",
                      border: "1px solid var(--border-hairline)",
                      color: "var(--ink-secondary)",
                    }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
            >
              {isPending ? "Starting…" : "Start League Night"}
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
              style={{ border: "1px solid var(--ink-primary)", color: "var(--ink-primary)" }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
