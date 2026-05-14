import { connection } from "next/server";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { getAllClubs } from "@/lib/clubs";
import LeaderboardTable from "./LeaderboardTable";

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  marginBottom: "8px",
};

export default async function LeaderboardPage() {
  await connection();
  const session = await auth();
  const isSuperAdmin = session?.user.role === "super_admin";
  const clubId = session?.user.clubId ?? null;

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

      {isSuperAdmin ? (
        // ── Super admin: one section per club ────────────────────────────────
        await (async () => {
          const clubs = await getAllClubs();
          if (clubs.length === 0) {
            return (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
                No clubs yet.
              </p>
            );
          }
          const clubData = await Promise.all(
            clubs.map(async (club) => ({ club, entries: await getLeaderboard(club.id) }))
          );
          return (
            <>
              {clubData.map(({ club, entries }) => (
                <section key={club.id} style={{ marginBottom: "64px" }}>
                  <p style={sectionLabelStyle}>{club.name}</p>
                  <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
                  {entries.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
                      No players yet.
                    </p>
                  ) : (
                    <LeaderboardTable entries={entries} />
                  )}
                </section>
              ))}
            </>
          );
        })()
      ) : (
        // ── Player / club manager: single club ───────────────────────────────
        <LeaderboardTable entries={await getLeaderboard(clubId)} />
      )}
    </main>
  );
}
