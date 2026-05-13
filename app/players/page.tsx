import { connection } from "next/server";
import { getPlayers } from "@/lib/players";
import { PlayerList } from "./components/PlayerList";

export default async function PlayersPage() {
  await connection();
  const players = await getPlayers();

  return (
    <main className="max-w-[1280px] mx-auto px-20 py-16">
      <header className="mb-16">
        <p className="text-meta uppercase tracking-widest text-ink-tertiary mb-3">
          Mighty Flights
        </p>
        <h1
          className="text-h1 font-display"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Player Roster
        </h1>
        <div
          className="mt-4 h-px w-full"
          style={{ backgroundColor: "var(--border-hairline)" }}
        />
      </header>

      <PlayerList players={players} />
    </main>
  );
}
