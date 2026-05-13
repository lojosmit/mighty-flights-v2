"use client";

import { useState, useTransition } from "react";
import {
  addPlayerToNight,
  removePlayerFromNight,
  reduceBoardCount,
  type RemovePlayerResult,
} from "@/lib/player-changes";
import type { Fixture } from "@/lib/db/schema";
import { locatePlayer } from "@/lib/player-change-utils";

interface Props {
  leagueNightId: string;
  attendees: { id: string; name: string }[];
  nonAttendees: { id: string; name: string }[];
  currentBench: string[];
  currentFixtures: Fixture[];
  boardCount: number;
}

type PanelState =
  | { mode: "idle" }
  | { mode: "confirm_remove"; playerId: string; playerName: string }
  | { mode: "confirm_board_remove"; playerId: string; playerName: string; boardLabel: string }
  | { mode: "confirm_reduce"; boardLabel: string };

export default function PlayerChangesPanel({
  leagueNightId,
  attendees,
  nonAttendees,
  currentBench,
  currentFixtures,
  boardCount,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>({ mode: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleRemoveClick(player: { id: string; name: string }) {
    const location = locatePlayer(currentFixtures, currentBench, player.id);
    if (location.status === "active_board") {
      setPanelState({
        mode: "confirm_board_remove",
        playerId: player.id,
        playerName: player.name,
        boardLabel: location.boardLabel,
      });
    } else {
      setPanelState({ mode: "confirm_remove", playerId: player.id, playerName: player.name });
    }
  }

  function handleConfirmRemove(playerId: string) {
    startTransition(async () => {
      const result: RemovePlayerResult = await removePlayerFromNight(leagueNightId, playerId);
      if (result.status === "board_reduction_required") {
        setPanelState({ mode: "confirm_reduce", boardLabel: result.boardLabel });
      } else {
        setPanelState({ mode: "idle" });
      }
    });
  }

  function handleAdd(playerId: string) {
    startTransition(async () => {
      await addPlayerToNight(leagueNightId, playerId);
    });
  }

  function handleReduceBoard() {
    startTransition(async () => {
      await reduceBoardCount(leagueNightId);
      setPanelState({ mode: "idle" });
    });
  }

  return (
    <div
      style={{
        marginTop: "40px",
        borderTop: "1px solid var(--border-hairline)",
        paddingTop: "24px",
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => { setExpanded((e) => !e); setPanelState({ mode: "idle" }); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
        }}
      >
        <span>{expanded ? "▲" : "▼"}</span>
        Player Changes · {attendees.length} attending
      </button>

      {expanded && (
        <div style={{ marginTop: "20px" }}>
          {/* Board reduction prompt */}
          {panelState.mode === "confirm_reduce" && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px 20px",
                border: "1px solid var(--accent-gold)",
                background: "var(--bg-elevated)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--ink-secondary)",
                  marginBottom: "12px",
                }}
              >
                Board {panelState.boardLabel} was forfeited. Reduce board count from{" "}
                {boardCount} to {boardCount - 1} for the next round?
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleReduceBoard} disabled={isPending} style={primaryBtnStyle(isPending)}>
                  {isPending ? "…" : "Reduce"}
                </button>
                <button onClick={() => setPanelState({ mode: "idle" })} style={ghostBtnStyle}>
                  Keep {boardCount}
                </button>
              </div>
            </div>
          )}

          {/* Remove confirmations */}
          {(panelState.mode === "confirm_remove" || panelState.mode === "confirm_board_remove") && (
            <div
              style={{
                marginBottom: "16px",
                padding: "14px 18px",
                border: "1px solid var(--border-hairline)",
                background: "var(--bg-elevated)",
              }}
            >
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-secondary)", marginBottom: "10px" }}>
                {panelState.mode === "confirm_board_remove"
                  ? `Removing ${panelState.playerName} will forfeit Board ${panelState.boardLabel}. Continue?`
                  : `Remove ${panelState.playerName} from this night?`}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleConfirmRemove(panelState.playerId)}
                  disabled={isPending}
                  style={primaryBtnStyle(isPending)}
                >
                  {isPending ? "…" : "Remove"}
                </button>
                <button onClick={() => setPanelState({ mode: "idle" })} style={ghostBtnStyle}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Attendee list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
            {attendees.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  border: "1px solid var(--border-hairline)",
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "18px",
                    color: "var(--ink-primary)",
                  }}
                >
                  {p.name}
                </span>
                {panelState.mode === "idle" && (
                  <button
                    onClick={() => handleRemoveClick(p)}
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
                      color: "var(--ink-tertiary)",
                      padding: "4px 8px",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add player */}
          {nonAttendees.length > 0 && panelState.mode === "idle" && (
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                  marginBottom: "8px",
                }}
              >
                Add late arrival
              </p>
              <select
                defaultValue=""
                disabled={isPending}
                onChange={(e) => { if (e.target.value) handleAdd(e.target.value); e.target.value = ""; }}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--ink-primary)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-hairline)",
                  padding: "8px 12px",
                  cursor: "pointer",
                  minWidth: "200px",
                }}
              >
                <option value="" disabled>Select player…</option>
                {nonAttendees.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "8px 16px",
  background: "var(--accent-primary)",
  color: "#ffffff",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
});

const ghostBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "8px 16px",
  background: "transparent",
  color: "var(--ink-tertiary)",
  border: "1px solid var(--border-hairline)",
  cursor: "pointer",
};
