import { getPlayers } from "@/lib/players";
import { LeagueNightSetup } from "./components/LeagueNightSetup";

export default async function NewLeagueNightPage() {
  const players = await getPlayers();

  return (
    <main className="max-w-[1280px] mx-auto px-20 py-16">
      <header className="mb-16">
        <p
          className="text-meta uppercase tracking-widest mb-3"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Mighty Flights
        </p>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "3rem",
            color: "var(--ink-primary)",
            lineHeight: 1.05,
          }}
        >
          New League Night
        </h1>
        <div
          className="mt-4 h-px w-full"
          style={{ backgroundColor: "var(--border-hairline)" }}
        />
      </header>

      <LeagueNightSetup players={players} />
    </main>
  );
}
