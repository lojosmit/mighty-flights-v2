import { connection } from "next/server";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { getAllClubs } from "@/lib/clubs";
import LeaderboardTable from "./LeaderboardTable";
import ClubFilter from "@/app/components/ClubFilter";

interface Props {
  searchParams: Promise<{ club?: string }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  await connection();
  const session = await auth();
  const isSuperAdmin = session?.user.role === "super_admin";
  const clubId = session?.user.clubId ?? null;

  const effectiveClubId = isSuperAdmin
    ? ((await searchParams).club ?? null)
    : clubId;

  const [entries, clubs] = await Promise.all([
    getLeaderboard(effectiveClubId),
    isSuperAdmin ? getAllClubs() : Promise.resolve([]),
  ]);

  return (
    <main className="mf-page">
      <header style={{ marginBottom: "64px" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            marginBottom: "12px",
          }}
        >
          Mighty Flights
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "32px", flexWrap: "wrap", marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "5vw",
              fontWeight: 400,
              color: "var(--ink-primary)",
              lineHeight: 1,
            }}
          >
            Season Standings
          </h1>
          {isSuperAdmin && (
            <ClubFilter clubs={clubs} selected={effectiveClubId} />
          )}
        </div>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      {entries.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
          {effectiveClubId ? "No players in this club yet." : "Select a club to view standings."}
        </p>
      ) : (
        <LeaderboardTable entries={entries} />
      )}
    </main>
  );
}
