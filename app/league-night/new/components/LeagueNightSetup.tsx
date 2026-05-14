"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Player, User, Club } from "@/lib/db/schema";
import { createLeagueNight } from "@/lib/league-nights";
import { canRunLeagueNight, maxBoards } from "@/lib/league-night-utils";
import { AttendeeSelector } from "./AttendeeSelector";
import { BoardCountPicker } from "./BoardCountPicker";

type Step = 0 | 1 | 2 | 3;

const STEP_LABELS = ["Schedule", "Attendees", "Boards", "Confirm"] as const;

interface Props {
  players: Player[];
  members: User[];
  clubId: string | null;
  clubs: Club[];
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  color: "var(--ink-primary)",
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border-hairline)",
  outline: "none",
  width: "100%",
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
  marginBottom: "8px",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function LeagueNightSetup({ players, members, clubId, clubs }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  // Step 0 state
  const [gameDate, setGameDate] = useState(todayIso());
  const [enableRsvp, setEnableRsvp] = useState(false);
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [hostId, setHostId] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>(clubId ?? "");

  // Step 1 state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Step 2 state
  const [boardCount, setBoardCount] = useState(1);

  const [isPending, startTransition] = useTransition();

  const effectiveClubId = clubId ?? selectedClubId;
  const playerCount = selected.size;
  const canProceed = canRunLeagueNight(playerCount);

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setBoardCount((prev) => Math.min(prev, Math.max(1, maxBoards(selected.size))));
  }

  function handleConfirm() {
    startTransition(async () => {
      const night = await createLeagueNight({
        attendingPlayerIds: Array.from(selected),
        boardCount,
        clubId: effectiveClubId || null,
        date: gameDate ? new Date(gameDate) : undefined,
        rsvpDeadline: enableRsvp && rsvpDeadline ? new Date(rsvpDeadline) : undefined,
        hostUserId: hostId || null,
      });
      router.push(`/league-night/${night.id}`);
    });
  }

  const selectedPlayers = players.filter((p) => selected.has(p.id));
  const selectedHost = members.find((m) => m.id === hostId);
  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  return (
    <div>
      {/* Step indicators */}
      <div className="mf-stepper">
        {STEP_LABELS.map((label, i) => {
          const n = i as Step;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-6 h-6 flex items-center justify-center font-medium flex-shrink-0"
                style={{
                  backgroundColor: active || done ? "var(--accent-primary)" : "transparent",
                  border: active || done ? "none" : "1px solid var(--border-hairline)",
                  color: active || done ? "#FFFFFF" : "var(--ink-tertiary)",
                  fontSize: "0.7rem",
                }}
              >
                {done ? "✓" : n + 1}
              </div>
              <span
                className="mf-step-label"
                style={{ color: active ? "var(--ink-primary)" : "var(--ink-tertiary)" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Step 0: Schedule ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ maxWidth: "480px" }}>
          <h2
            className="mb-8"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
          >
            Schedule this night
          </h2>

          {/* Club selector — only for super_admin with no club */}
          {!clubId && clubs.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Club</label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— select club —</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Game date</label>
            <input
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Host selection */}
          {members.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Host for this night</label>
              <select
                value={hostId}
                onChange={(e) => setHostId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— no host assigned —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
              {hostId && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
                  Host gets edit access for this night only. Expires when the night ends.
                </p>
              )}
            </div>
          )}

          {/* RSVP */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enableRsvp}
                onChange={(e) => setEnableRsvp(e.target.checked)}
                style={{ width: "14px", height: "14px", accentColor: "var(--accent-primary)" }}
              />
              Enable RSVP link
            </label>

            {enableRsvp && (
              <div style={{ marginTop: "12px" }}>
                <label style={labelStyle}>RSVP deadline</label>
                <input
                  type="datetime-local"
                  value={rsvpDeadline}
                  onChange={(e) => setRsvpDeadline(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
                  An RSVP link will be generated after you create the night.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!gameDate}
            className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
          >
            Select Attendees →
          </button>
        </div>
      )}

      {/* ── Step 1: Attendees ────────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          {players.length === 0 ? (
            <div style={{ maxWidth: "480px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-tertiary)", marginBottom: "16px" }}>
                No players found for this club. Add players to the roster first via the Players page.
              </p>
              <button
                onClick={() => setStep(0)}
                className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
                style={{ border: "1px solid var(--ink-primary)", color: "var(--ink-primary)" }}
              >
                Back
              </button>
            </div>
          ) : (
            <>
              <AttendeeSelector players={players} selected={selected} onToggle={togglePlayer} />
              <div className="mt-10 flex items-center gap-6">
                <button
                  onClick={() => { setBoardCount(1); setStep(2); }}
                  disabled={!canProceed}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
                >
                  Choose Boards
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
                  style={{ border: "1px solid var(--border-hairline)", color: "var(--ink-tertiary)" }}
                >
                  Back
                </button>
                {playerCount > 0 && !canProceed && (
                  <p className="text-small" style={{ color: "var(--ink-tertiary)" }}>
                    Need at least 6 players to start.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Boards ───────────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <BoardCountPicker playerCount={playerCount} selected={boardCount} onSelect={setBoardCount} />
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

      {/* ── Step 3: Confirm ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ maxWidth: "480px" }}>
          <h2
            className="mb-8"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
          >
            Confirm and start
          </h2>

          <div
            className="p-8 mb-8"
            style={{ border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-elevated)" }}
          >
            <Row label="Date" value={new Date(gameDate).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
            {selectedClub && <Row label="Club" value={selectedClub.name} />}
            {selectedHost && <Row label="Host" value={`${selectedHost.name} (temp)`} />}
            <Row label="Players" value={String(playerCount)} />
            <Row label="Boards" value={String(boardCount)} />
            {enableRsvp && rsvpDeadline && (
              <Row label="RSVP deadline" value={new Date(rsvpDeadline).toLocaleString("en-AU")} />
            )}
            <div className="border-t pt-4 mt-4" style={{ borderColor: "var(--border-hairline)" }}>
              <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
                Attending
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="text-small px-2 py-1"
                    style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", border: "1px solid var(--border-hairline)", color: "var(--ink-secondary)" }}
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
              {isPending ? "Creating…" : "Start League Night"}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between mb-5">
      <span className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--accent-gold)" }}>
        {value}
      </span>
    </div>
  );
}
