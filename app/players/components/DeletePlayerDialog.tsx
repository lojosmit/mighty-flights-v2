"use client";

import { useTransition } from "react";
import type { Player } from "@/lib/db/schema";
import { deletePlayer } from "@/lib/players";

interface Props {
  player: Player;
  onClose: () => void;
}

export function DeletePlayerDialog({ player, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deletePlayer(player.id);
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
          Remove Player
        </p>
        <h2
          className="mb-4"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", color: "var(--ink-primary)" }}
        >
          {player.name}
        </h2>
        <p className="text-body mb-8" style={{ color: "var(--ink-secondary)" }}>
          This will permanently remove {player.name} from the roster. This action cannot be undone.
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "var(--forfeit)", color: "#FFFFFF" }}
          >
            {isPending ? "Removing…" : "Remove"}
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
      </div>
    </div>
  );
}
