import { connection } from "next/server";
import { auth } from "@/auth";
import { getPlayers } from "@/lib/players";
import { getAllClubs } from "@/lib/clubs";
import { PlayerList } from "./components/PlayerList";
import ClubFilter from "@/app/components/ClubFilter";

interface Props {
  searchParams: Promise<{ club?: string }>;
}

export default async function PlayersPage({ searchParams }: Props) {
  await connection();
  const session = await auth();
  const isSuperAdmin = session?.user.role === "super_admin";
  const clubId = session?.user.clubId ?? null;

  const effectiveClubId = isSuperAdmin
    ? ((await searchParams).club ?? null)
    : clubId;

  const [players, clubs] = await Promise.all([
    getPlayers(effectiveClubId),
    isSuperAdmin ? getAllClubs() : Promise.resolve([]),
  ]);

  return (
    <main className="mf-page">
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

      {isSuperAdmin && (
        <ClubFilter clubs={clubs} selected={effectiveClubId} />
      )}

      <PlayerList players={players} />
    </main>
  );
}
