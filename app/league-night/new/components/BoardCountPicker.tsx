"use client";

import { validBoardCounts } from "@/lib/league-night-utils";

interface Props {
  playerCount: number;
  selected: number;
  onSelect: (count: number) => void;
  fixedOptions?: number[];
  heading?: string;
  note?: string;
}

const BOARD_LABELS = ["A", "B", "C", "D", "E"];

export function BoardCountPicker({ playerCount, selected, onSelect, fixedOptions, heading, note }: Props) {
  const options = fixedOptions ?? validBoardCounts(playerCount);
  const defaultNote = fixedOptions
    ? note ?? "Adjust once players confirm via RSVP."
    : `${playerCount} players — up to ${options.length} board${options.length !== 1 ? "s" : ""} valid.`;

  return (
    <div>
      <h2
        className="mb-2"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.75rem",
          color: "var(--ink-primary)",
        }}
      >
        {heading ?? "How many boards tonight?"}
      </h2>
      <p className="text-small mb-8" style={{ color: "var(--ink-tertiary)" }}>
        {defaultNote}
      </p>

      <div className="flex gap-3">
        {options.map((count) => {
          const active = selected === count;
          const labels = BOARD_LABELS.slice(0, count).join(", ");
          return (
            <button
              key={count}
              onClick={() => onSelect(count)}
              className="flex flex-col items-center gap-2 px-8 py-5 cursor-pointer transition-colors"
              style={{
                border: active
                  ? "1px solid var(--accent-primary)"
                  : "1px solid var(--border-hairline)",
                backgroundColor: active ? "var(--accent-primary)" : "transparent",
                color: active ? "#FFFFFF" : "var(--ink-primary)",
                minWidth: "96px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "2.5rem",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                {count}
              </span>
              <span
                className="text-meta uppercase tracking-widest"
                style={{
                  color: active ? "rgba(255,255,255,0.7)" : "var(--ink-tertiary)",
                  fontSize: "0.65rem",
                }}
              >
                {labels}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
