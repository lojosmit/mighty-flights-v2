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
      <header style={{ marginBottom: "64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "12px" }}>
          Mighty Flights
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1, marginBottom: "24px" }}>
          New Game
        </h1>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
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
