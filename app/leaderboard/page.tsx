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
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(48px, 6vw, 72px)",
            fontWeight: 400,
            color: "var(--ink-primary)",
            lineHeight: 1,
            marginBottom: "24px",
          }}
        >
          Season Standings
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", flex: 1 }} />
          <a
            href="/api/export/stats"
            download
            style={{
              marginLeft: "24px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Export CSV
          </a>
        </div>
      </header>

      {isSuperAdmin && (
        <ClubFilter clubs={clubs} selected={effectiveClubId} />
      )}

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
