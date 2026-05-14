import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { getLeaderboard, sortLeaderboard } from "@/lib/leaderboard";
import { getActiveLeagueNight, getAllLeagueNights } from "@/lib/league-nights";

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  setup: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export default async function HomePage() {
  await connection();

  const session = await auth();
  const clubId = session?.user.clubId ?? null;

  const [leaderboard, activeNight, allNights] = await Promise.all([
    getLeaderboard(clubId),
    getActiveLeagueNight(),
    getAllLeagueNights(clubId),
  ]);

  const top5 = sortLeaderboard(leaderboard, "wins", "desc").slice(0, 5);
  const recentNights = allNights.slice(0, 5);

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    paddingBottom: "12px",
    textAlign: "right",
  };

  return (
    <main style={{ flex: 1 }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "clamp(40px, 6vw, 80px) clamp(20px, 6vw, 80px) 48px",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={200}
          height={200}
          priority
          style={{ display: "block", marginBottom: "24px" }}
        />

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            marginBottom: "12px",
          }}
        >
          {new Date().getFullYear()} Season
        </p>

        {activeNight ? (
          <Link
            href={`/league-night/${activeNight.id}`}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              textDecoration: "none",
              border: "1px solid var(--accent-primary)",
              padding: "10px 24px",
              marginTop: "8px",
            }}
          >
            Night in progress — view live
          </Link>
        ) : (
          <Link
            href="/league-night/new"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
              textDecoration: "none",
              border: "1px solid var(--border-hairline)",
              padding: "10px 24px",
              marginTop: "8px",
            }}
          >
            Schedule a night
          </Link>
        )}
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <section className="mf-page mf-grid-2" style={{ paddingTop: "56px", paddingBottom: "56px" }}>
        {/* Top 5 Standings */}
        <div>
          <div style={{ marginBottom: "32px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-tertiary)",
                marginBottom: "8px",
              }}
            >
              Season Standings
            </p>
            <div style={{ height: "1px", backgroundColor: "var(--accent-gold)" }} />
          </div>

          {top5.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--ink-tertiary)",
              }}
            >
              No results yet.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                  <th style={{ ...thStyle, textAlign: "left", width: "32px" }}>#</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Player</th>
                  <th style={thStyle}>W</th>
                  <th style={thStyle}>L</th>
                  <th style={thStyle}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((player, i) => {
                  const isTop3 = i < 3;
                  return (
                    <tr
                      key={player.id}
                      style={{
                        height: "56px",
                        borderBottom: "1px solid var(--border-hairline)",
                        backgroundColor: isTop3 ? "transparent" : undefined,
                      }}
                    >
                      <td
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: isTop3 ? "var(--accent-gold)" : "var(--ink-tertiary)",
                          fontWeight: isTop3 ? 600 : 400,
                          paddingRight: "16px",
                          width: "32px",
                        }}
                      >
                        {i + 1}
                      </td>
                      <td>
                        <Link
                          href={`/players/${player.id}`}
                          style={{
                            fontFamily: "var(--font-cormorant)",
                            fontSize: "22px",
                            fontWeight: 400,
                            color: "var(--ink-primary)",
                            textDecoration: "none",
                          }}
                        >
                          {player.name}
                        </Link>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {player.wins}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {player.losses}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {player.winRatio.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {leaderboard.length > 5 && (
            <div style={{ marginTop: "24px" }}>
              <Link
                href="/leaderboard"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                  textDecoration: "none",
                }}
              >
                Full standings →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Nights */}
        <div>
          <div style={{ marginBottom: "32px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-tertiary)",
                marginBottom: "8px",
              }}
            >
              Recent Nights
            </p>
            <div style={{ height: "1px", backgroundColor: "var(--accent-gold)" }} />
          </div>

          {recentNights.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--ink-tertiary)",
              }}
            >
              No nights played yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentNights.map((night) => {
                const label = STATUS_LABEL[night.status] ?? night.status;
                const isLive = night.status === "in_progress";
                return (
                  <Link
                    key={night.id}
                    href={`/league-night/${night.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      padding: "18px 0",
                      borderBottom: "1px solid var(--border-hairline)",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "20px",
                        fontWeight: 400,
                        color: "var(--ink-primary)",
                      }}
                    >
                      {formatDate(night.date)}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: isLive ? "var(--accent-gold)" : "var(--ink-tertiary)",
                      }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {allNights.length > 5 && (
            <div style={{ marginTop: "24px" }}>
              <Link
                href="/history"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                  textDecoration: "none",
                }}
              >
                Full history →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
