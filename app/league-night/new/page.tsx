import { connection } from "next/server";
import { auth } from "@/auth";
import { getPlayers, syncClubPlayers } from "@/lib/players";
import { getUsersByClub } from "@/lib/users";
import { getAllClubs } from "@/lib/clubs";
import { LeagueNightSetup } from "./components/LeagueNightSetup";
import type { User, Club } from "@/lib/db/schema";

export default async function NewLeagueNightPage() {
  await connection();
  const session = await auth();
  const clubId = session?.user.clubId ?? null;

  // Ensure all club members have player profiles before loading the selector
  if (clubId) await syncClubPlayers(clubId);

  const [players, members, clubs]: [
    Awaited<ReturnType<typeof getPlayers>>,
    User[],
    Club[],
  ] = await Promise.all([
    getPlayers(clubId),
    clubId ? getUsersByClub(clubId) : Promise.resolve([]),
    !clubId ? getAllClubs() : Promise.resolve([]),
  ]);

  return (
    <main className="mf-page">
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
          New Game
        </h1>
        <div
          className="mt-4 h-px w-full"
          style={{ backgroundColor: "var(--border-hairline)" }}
        />
      </header>

      <LeagueNightSetup
        players={players}
        members={members}
        clubId={clubId}
        clubs={clubs}
      />
    </main>
  );
}
