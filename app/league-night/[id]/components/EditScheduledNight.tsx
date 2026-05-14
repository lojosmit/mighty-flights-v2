"use client";

import { useState, useTransition } from "react";
import { updateLeagueNight } from "@/lib/league-nights";
import type { User } from "@/lib/db/schema";

interface Props {
  leagueNightId: string;
  initialDate: string; // ISO string
  initialBoardCount: number;
  initialHostUserId: string | null;
  members: User[];
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
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
  marginBottom: "6px",
};

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditScheduledNight({
  leagueNightId,
  initialDate,
  initialBoardCount,
  initialHostUserId,
  members,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dateTime, setDateTime] = useState(toLocalDateTimeInput(initialDate));
  const [boardCount, setBoardCount] = useState(initialBoardCount);
  const [hostId, setHostId] = useState(initialHostUserId ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateLeagueNight(leagueNightId, {
        date: dateTime ? new Date(dateTime) : undefined,
        boardCount,
        hostUserId: hostId || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: saved ? "var(--accent-gold)" : "var(--ink-tertiary)",
          background: "none",
          border: "1px solid var(--border-hairline)",
          padding: "6px 14px",
          cursor: "pointer",
        }}
      >
        {saved ? "Saved ✓" : "Edit details"}
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "20px 24px",
        border: "1px solid var(--border-hairline)",
        background: "var(--bg-elevated)",
        maxWidth: "400px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          marginBottom: "16px",
        }}
      >
        Edit Details
      </p>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Date &amp; time</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Boards</label>
        <select
          value={boardCount}
          onChange={(e) => setBoardCount(Number(e.target.value))}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n} board{n !== 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>

      {members.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Host</label>
          <select
            value={hostId}
            onChange={(e) => setHostId(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">— no host —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleSave}
          disabled={isPending}
          style={{
            padding: "8px 20px",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "var(--accent-primary)",
            color: "#fff",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "transparent",
            color: "var(--ink-tertiary)",
            border: "1px solid var(--border-hairline)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
