"use client";

import { useState, useTransition } from "react";
import type { Player } from "@/lib/db/schema";
import { updatePlayer } from "@/lib/players";

interface Props {
  player: Player;
  onClose: () => void;
}

export function EditPlayerDialog({ player, onClose }: Props) {
  const [name, setName] = useState(player.name);
  const [rank, setRank] = useState(String(player.seasonRank));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await updatePlayer(player.id, { name: trimmed, seasonRank: parseInt(rank, 10) });
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(10,20,12,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="p-8 w-[420px] shadow-xl"
        style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-hairline)" }}
      >
        <p className="text-meta uppercase tracking-widest mb-2" style={{ color: "var(--ink-tertiary)" }}>
          Edit Player
        </p>
        <h2
          className="mb-8"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
        >
          {player.name}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-b bg-transparent pb-1.5 text-body outline-none w-full"
              style={{ borderColor: "var(--border-hairline)", color: "var(--ink-primary)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-meta uppercase tracking-widest" style={{ color: "var(--ink-tertiary)" }}>
              Rank
            </label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              min={1}
              required
              className="border-b bg-transparent pb-1.5 text-body outline-none w-16"
              style={{
                borderColor: "var(--border-hairline)",
                color: "var(--ink-primary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }}
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer"
              style={{ border: "1px solid var(--ink-primary)", color: "var(--ink-primary)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
