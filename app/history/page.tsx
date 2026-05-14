import { connection } from "next/server";
import Link from "next/link";
import { auth } from "@/auth";
import { getAllLeagueNights } from "@/lib/league-nights";
import type { LeagueNightStatus } from "@/lib/db/schema";

const STATUS_LABEL: Record<LeagueNightStatus, string> = {
  setup:       "Not started",
  in_progress: "In progress",
  completed:   "Completed",
};

const STATUS_COLOR: Record<LeagueNightStatus, string> = {
  setup:       "var(--ink-tertiary)",
  in_progress: "var(--accent-gold)",
  completed:   "var(--ink-tertiary)",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const thStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  paddingBottom: "12px",
  whiteSpace: "nowrap",
};

export default async function HistoryPage() {
  await connection();
  const session = await auth();
  const nights = await getAllLeagueNights(session?.user.clubId);

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
          Season History
        </h1>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      {nights.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            textAlign: "center",
            paddingTop: "48px",
          }}
        >
          No league nights yet
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
              <th style={{ ...thStyle, textAlign: "left" }}>Date</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Players</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Boards</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Status</th>
              <th style={{ ...thStyle, width: "48px" }} />
            </tr>
          </thead>
          <tbody>
            {nights.map((night) => (
              <tr
                key={night.id}
                style={{
                  height: "64px",
                  borderBottom: "1px solid var(--border-hairline)",
                }}
              >
                <td style={{ paddingRight: "32px" }}>
                  <Link
                    href={`/league-night/${night.id}`}
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "22px",
                      fontWeight: 400,
                      color: "var(--ink-primary)",
                      textDecoration: "none",
                    }}
                  >
                    {formatDate(night.date)}
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
                  {night.attendingPlayerIds.length}
                </td>

                <td
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--ink-secondary)",
                  }}
                >
                  {night.boardCount}
                </td>

                <td
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: STATUS_COLOR[night.status],
                  }}
                >
                  {STATUS_LABEL[night.status]}
                </td>

                <td style={{ textAlign: "right", paddingLeft: "24px" }}>
                  <Link
                    href={`/league-night/${night.id}`}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--ink-tertiary)",
                      textDecoration: "none",
                    }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
