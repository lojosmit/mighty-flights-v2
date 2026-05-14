"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Player, User, Club } from "@/lib/db/schema";
import { createLeagueNight } from "@/lib/league-nights";
import { createRound1 } from "@/lib/rounds";
import { canRunLeagueNight } from "@/lib/league-night-utils";
import { AttendeeSelector } from "./AttendeeSelector";
import { BoardCountPicker } from "./BoardCountPicker";

type Mode = "schedule" | "start-now";
type Step = 0 | 1 | 2;

const SCHEDULE_STEPS = ["Details", "Confirm"] as const;
const START_STEPS = ["Players", "Boards", "Confirm"] as const;

interface Props {
  players: Player[];
  members: User[];
  clubId: string | null;
  clubs: Club[];
}

function nextHourLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
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

export function LeagueNightSetup({ players, members, clubId, clubs }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("schedule");
  const [step, setStep] = useState<Step>(0);

  // Schedule mode state
  const [gameDateTime, setGameDateTime] = useState(nextHourLocal());
  const [enableRsvp, setEnableRsvp] = useState(true);
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [hostId, setHostId] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<string>(clubId ?? "");

  // Start Now mode state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Shared
  const [boardCount, setBoardCount] = useState(1);
  const [isPending, startTransition] = useTransition();

  const effectiveClubId = clubId ?? selectedClubId;
  const visiblePlayers = effectiveClubId
    ? players.filter((p) => p.clubId === effectiveClubId)
    : players;
  const stepLabels = mode === "schedule" ? SCHEDULE_STEPS : START_STEPS;

  function switchMode(m: Mode) {
    setMode(m);
    setStep(0);
    setSelected(new Set());
    setBoardCount(1);
  }

  const playerCount = selected.size;
  const canProceed = canRunLeagueNight(playerCount);

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSchedule() {
    startTransition(async () => {
      await createLeagueNight({
        attendingPlayerIds: [],
        boardCount: 1, // placeholder — set at start time after RSVPs
        clubId: effectiveClubId || null,
        date: gameDateTime ? new Date(gameDateTime) : new Date(),
        enableRsvp,
        rsvpDeadline: enableRsvp && rsvpDeadline ? new Date(rsvpDeadline) : undefined,
        hostUserId: hostId || null,
      });
      router.push("/history");
    });
  }

  function handleStartNow() {
    startTransition(async () => {
      const night = await createLeagueNight({
        attendingPlayerIds: Array.from(selected),
        boardCount,
        clubId: effectiveClubId || null,
        date: new Date(),
      });
      await createRound1(night.id);
      router.push(`/league-night/${night.id}`);
    });
  }

  const selectedHost = members.find((m) => m.id === hostId);
  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  return (
    <div>
      {/* Mode toggle */}
      <div
        style={{
          display: "inline-flex",
          border: "1px solid var(--border-hairline)",
          marginBottom: "48px",
        }}
      >
        {(["schedule", "start-now"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: "10px 28px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              border: "none",
              backgroundColor: mode === m ? "var(--accent-primary)" : "transparent",
              color: mode === m ? "#ffffff" : "var(--ink-tertiary)",
              transition: "background-color 150ms ease, color 150ms ease",
            }}
          >
            {m === "schedule" ? "Schedule" : "Start Now"}
          </button>
        ))}
      </div>

      {/* Step indicators */}
      <div className="mf-stepper" style={{ marginBottom: "40px" }}>
        {stepLabels.map((label, i) => {
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

      {/* ── SCHEDULE MODE ──────────────────────────────────────────────── */}
      {mode === "schedule" && (
        <>
          {step === 0 && (
            <div style={{ maxWidth: "480px" }}>
              <h2
                className="mb-8"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
              >
                Schedule this night
              </h2>

              {/* Club — super_admin only */}
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

              {/* Date & time */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Date &amp; time</label>
                <input
                  type="datetime-local"
                  value={gameDateTime}
                  onChange={(e) => setGameDateTime(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Host */}
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
                      Host gets edit access for this night only.
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
                    <label style={labelStyle}>RSVP deadline (optional)</label>
                    <input
                      type="datetime-local"
                      value={rsvpDeadline}
                      onChange={(e) => setRsvpDeadline(e.target.value)}
                      style={inputStyle}
                    />
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
                      Players RSVP via the link and are added as attendees automatically.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!gameDateTime || (!clubId && !selectedClubId && clubs.length > 0)}
                className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
              >
                Review →
              </button>
            </div>
          )}

          {step === 1 && (
            <div style={{ maxWidth: "480px" }}>
              <h2
                className="mb-8"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
              >
                Confirm and schedule
              </h2>
              <div
                className="p-8 mb-8"
                style={{ border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-elevated)" }}
              >
                <Row
                  label="Date & time"
                  value={new Date(gameDateTime).toLocaleString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
                {selectedClub && <Row label="Club" value={selectedClub.name} />}
                {selectedHost && <Row label="Host" value={`${selectedHost.name} (temp)`} />}
                <Row
                  label="RSVP"
                  value={
                    enableRsvp
                      ? rsvpDeadline
                        ? `Deadline ${new Date(rsvpDeadline).toLocaleString("en-AU")}`
                        : "Enabled — no deadline"
                      : "Disabled"
                  }
                />
                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                  Board count is set when the night starts.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSchedule}
                  disabled={isPending}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
                >
                  {isPending ? "Scheduling…" : "Schedule Night"}
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
                  style={{ border: "1px solid var(--border-hairline)", color: "var(--ink-tertiary)" }}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── START NOW MODE ─────────────────────────────────────────────── */}
      {mode === "start-now" && (
        <>
          {step === 0 && (
            players.length === 0 ? (
              <div style={{ maxWidth: "480px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-tertiary)" }}>
                  No players found for this club. Add players via club management first.
                </p>
              </div>
            ) : (
              <>
                {/* Club — super_admin only */}
                {!clubId && clubs.length > 0 && (
                  <div style={{ maxWidth: "480px", marginBottom: "24px" }}>
                    <label style={labelStyle}>Club</label>
                    <select
                      value={selectedClubId}
                      onChange={(e) => { setSelectedClubId(e.target.value); setSelected(new Set()); }}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">— select club —</option>
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <AttendeeSelector players={visiblePlayers} selected={selected} onToggle={togglePlayer} />
                <div className="mt-10 flex items-center gap-6">
                  <button
                    onClick={() => { setBoardCount(1); setStep(1); }}
                    disabled={!canProceed}
                    className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
                  >
                    Choose Boards →
                  </button>
                  {playerCount > 0 && !canProceed && (
                    <p className="text-small" style={{ color: "var(--ink-tertiary)" }}>
                      Need at least 6 players.
                    </p>
                  )}
                </div>
              </>
            )
          )}

          {step === 1 && (
            <div>
              <BoardCountPicker playerCount={playerCount} selected={boardCount} onSelect={setBoardCount} />
              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
                >
                  Review
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
                  style={{ border: "1px solid var(--border-hairline)", color: "var(--ink-tertiary)" }}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ maxWidth: "480px" }}>
              <h2
                className="mb-8"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
              >
                Ready to start?
              </h2>
              <div
                className="p-8 mb-8"
                style={{ border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-elevated)" }}
              >
                {selectedClub && <Row label="Club" value={selectedClub.name} />}
                <Row label="Players" value={String(playerCount)} />
                <Row label="Boards" value={String(boardCount)} />
                <div className="border-t pt-4 mt-4" style={{ borderColor: "var(--border-hairline)" }}>
                  <span
                    className="text-meta uppercase tracking-widest"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    Attending
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visiblePlayers
                      .filter((p) => selected.has(p.id))
                      .map((p) => (
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
                  onClick={handleStartNow}
                  disabled={isPending}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
                >
                  {isPending ? "Starting…" : "Start Night →"}
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
                  style={{ border: "1px solid var(--border-hairline)", color: "var(--ink-tertiary)" }}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </>
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
      <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.1rem", color: "var(--accent-gold)" }}>
        {value}
      </span>
    </div>
  );
}
