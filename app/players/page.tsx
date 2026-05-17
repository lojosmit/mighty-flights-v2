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

  const isManager = isSuperAdmin || session?.user.role === "club_manager";

  const [players, clubs] = await Promise.all([
    getPlayers(effectiveClubId),
    isSuperAdmin ? getAllClubs() : Promise.resolve([]),
  ]);

  return (
    <main className="mf-page">
      <header style={{ marginBottom: "64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "12px" }}>
          Mighty Flights
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "32px", flexWrap: "wrap", marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1 }}>
            Player Roster
          </h1>
          {isSuperAdmin && (
            <ClubFilter clubs={clubs} selected={effectiveClubId} />
          )}
        </div>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      <PlayerList players={players} canEdit={isManager} clubId={effectiveClubId} />
    </main>
  );
}
