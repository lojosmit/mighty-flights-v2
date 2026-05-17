import { connection } from "next/server";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getLeagueNight } from "@/lib/league-nights";
import { getRoundsForNight } from "@/lib/rounds";
import { getPlayers } from "@/lib/players";
import { getUsersByClub } from "@/lib/users";
import { getFixturePredictions } from "@/lib/predictions";
import { getHandicapTable } from "@/lib/handicap";
import { computeMultiplier } from "@/lib/handicap-utils";
import { appUrl } from "@/lib/app-url";
import RoundView from "./components/RoundView";
import RoundHistory from "./components/RoundHistory";
import EditScheduledNight from "./components/EditScheduledNight";
import StartNightPanel from "./components/StartNightPanel";

export default async function LeagueNightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const session = await auth();

  const [night, allRounds, allPlayers] = await Promise.all([
    getLeagueNight(id),
    getRoundsForNight(id),
    getPlayers(),
  ]);

  const members = night?.clubId ? await getUsersByClub(night.clubId) : [];

  if (!night) notFound();

  const isManager = ["super_admin", "club_manager"].includes(session?.user.role ?? "");
  const isNightHost = !!session && night.hostUserId === session.user.id;
  const canManageSchedule = isManager;                  // edit attendees / details before start
  const canStartNight = isManager || isNightHost;       // start round 1 (within 15-min window)
  const canEdit = isManager || isNightHost;             // in-game edits

  const playerMap: Record<string, string> = {};
  for (const p of allPlayers) {
    if (night.attendingPlayerIds.includes(p.id)) {
      playerMap[p.id] = p.name;
    }
  }

  // ── no rounds yet: pre-start screen ──────────────────────────────────────

  if (allRounds.length === 0) {
    const nightDateLabel = new Date(night.date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const nightTimeLabel = new Date(night.date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const now = new Date();
    const minutesUntil = (new Date(night.date).getTime() - now.getTime()) / 60_000;
    const tooEarly = minutesUntil > 15;

    const rsvpLink = night.rsvpToken
      ? await appUrl(`/rsvp/${night.rsvpToken}`)
      : null;

    const metaStyle: React.CSSProperties = {
      fontFamily: "var(--font-body)",
      fontSize: "11px",
      fontWeight: 500,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-tertiary)",
    };

    return (
      <main className="mf-page">
        <header style={{ marginBottom: "48px" }}>
          <p style={{ ...metaStyle, marginBottom: "12px" }}>League Game · Scheduled</p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "5vw",
              fontWeight: 400,
              lineHeight: 1.05,
              color: "var(--ink-primary)",
              marginBottom: "12px",
            }}
          >
            {nightDateLabel}
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--ink-secondary)", marginBottom: "8px" }}>
            {nightTimeLabel} · {night.attendingPlayerIds.length} attending
          </p>
          {night.hostUserId && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)" }}>
              Host assigned
            </p>
          )}
          <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginTop: "24px" }} />
        </header>

        {/* Edit controls — managers only */}
        {canManageSchedule && (
          <div style={{ marginBottom: "40px" }}>
            <EditScheduledNight
              leagueNightId={id}
              initialDate={new Date(night.date).toISOString()}
              initialBoardCount={night.boardCount}
              initialHostUserId={night.hostUserId ?? null}
              members={members}
            />
          </div>
        )}

        {/* RSVP link */}
        {rsvpLink && (
          <div
            style={{
              marginBottom: "40px",
              padding: "16px 20px",
              border: "1px solid var(--border-hairline)",
              background: "var(--bg-elevated)",
            }}
          >
            <p style={{ ...metaStyle, marginBottom: "10px" }}>RSVP Link</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--ink-secondary)",
                  wordBreak: "break-all",
                  flex: 1,
                }}
              >
                {rsvpLink}
              </code>
            </div>
            {night.rsvpDeadline && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
                Deadline: {new Date(night.rsvpDeadline).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}

        {/* Start action */}
        {canStartNight ? (
          <StartNightPanel
            leagueNightId={id}
            playerCount={night.attendingPlayerIds.length}
            minutesUntil={minutesUntil}
            nightTimeLabel={nightTimeLabel}
          />
        ) : (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-tertiary)" }}>
            Waiting for the host to start the game.
          </p>
        )}
      </main>
    );
  }

  // ── rounds exist ──────────────────────────────────────────────────────────

  const currentRound = allRounds[allRounds.length - 1];
  const pastRounds = allRounds.slice(0, -1);

  const allPlayersList = allPlayers.map((p) => ({ id: p.id, name: p.name }));
  const [predictions, handicapTable] = await Promise.all([
    getFixturePredictions(currentRound.fixtures),
    getHandicapTable(),
  ]);

  const playerHandicapMap: Record<string, number> = {};
  for (const p of allPlayers) {
    const row = handicapTable.find((r) => r.rankFrom <= p.seasonRank && r.rankTo >= p.seasonRank);
    playerHandicapMap[p.id] = row ? parseFloat(row.multiplier) : computeMultiplier(p.seasonRank);
  }

  return (
    <main
      className="mf-page"
      style={{ position: "relative" }}
    >
      <span
        aria-hidden
        style={{
          position: "fixed",
          bottom: "72px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-cormorant)",
          fontSize: "480px",
          fontWeight: 400,
          lineHeight: 0.85,
          color: "var(--ink-primary)",
          opacity: 0.04,
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 0,
          whiteSpace: "nowrap",
        }}
      >
        {currentRound.roundNumber}
      </span>

      <RoundView
        round={currentRound}
        playerMap={playerMap}
        leagueNightId={id}
        nightStatus={night.status}
        allPlayers={allPlayersList}
        boardCount={night.boardCount}
        predictions={predictions}
        playerHandicapMap={playerHandicapMap}
        canEdit={canEdit}
      />

      <RoundHistory rounds={pastRounds} playerMap={playerMap} />
    </main>
  );
}
