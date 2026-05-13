import { notFound } from "next/navigation";
import { getLeagueNight } from "@/lib/league-nights";
import { getRoundsForNight, createRound1 } from "@/lib/rounds";
import { getPlayers } from "@/lib/players";
import RoundView from "./components/RoundView";
import RoundHistory from "./components/RoundHistory";

export default async function LeagueNightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [night, allRounds, allPlayers] = await Promise.all([
    getLeagueNight(id),
    getRoundsForNight(id),
    getPlayers(),
  ]);

  if (!night) notFound();

  const playerMap: Record<string, string> = {};
  for (const p of allPlayers) {
    if (night.attendingPlayerIds.includes(p.id)) {
      playerMap[p.id] = p.name;
    }
  }

  async function startRound1() {
    "use server";
    await createRound1(id);
  }

  // ── no rounds yet: pre-start screen ──────────────────────────────────────

  if (allRounds.length === 0) {
    const nightDate = new Date(night.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <main className="max-w-[1280px] mx-auto px-20 py-16">
        <header style={{ marginBottom: "64px" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
              marginBottom: "12px",
            }}
          >
            League Night
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "48px",
              fontWeight: 400,
              lineHeight: 1.05,
              color: "var(--ink-primary)",
              marginBottom: "16px",
            }}
          >
            {nightDate}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--ink-secondary)",
              marginBottom: "32px",
            }}
          >
            {night.attendingPlayerIds.length} players attending ·{" "}
            {night.boardCount} {night.boardCount === 1 ? "board" : "boards"}
          </p>
          <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
        </header>

        <form action={startRound1}>
          <button
            type="submit"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "14px 28px",
              background: "var(--accent-primary)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Start Round 1
          </button>
        </form>
      </main>
    );
  }

  // ── rounds exist ──────────────────────────────────────────────────────────

  const currentRound = allRounds[allRounds.length - 1];
  const pastRounds = allRounds.slice(0, -1);

  return (
    <main
      className="max-w-[1280px] mx-auto px-20 py-16"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <RoundView
        round={currentRound}
        playerMap={playerMap}
        leagueNightId={id}
        nightStatus={night.status}
      />

      <RoundHistory rounds={pastRounds} playerMap={playerMap} />
    </main>
  );
}
