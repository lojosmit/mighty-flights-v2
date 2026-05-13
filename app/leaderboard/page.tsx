import { getLeaderboard } from "@/lib/leaderboard";
import LeaderboardTable from "./LeaderboardTable";

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 80px" }}>
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
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      <LeaderboardTable entries={entries} />
    </main>
  );
}
