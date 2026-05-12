"use client";

import { useState, useTransition } from "react";
import { createPlayer } from "@/lib/players";

export function AddPlayerForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createPlayer({ name: trimmed });
      setName("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          className="text-meta uppercase tracking-widest"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          required
          className="border-b bg-transparent pb-1.5 text-body outline-none focus:border-b-2 w-64"
          style={{
            borderColor: "var(--border-hairline)",
            color: "var(--ink-primary)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-7 py-3 text-small uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
        style={{
          backgroundColor: "var(--accent-primary)",
          color: "#FFFFFF",
        }}
      >
        {isPending ? "Adding…" : "Add Player"}
      </button>
    </form>
  );
}
