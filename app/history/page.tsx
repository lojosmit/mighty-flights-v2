import { connection } from "next/server";
import Link from "next/link";
import { auth } from "@/auth";
import { getAllLeagueNights } from "@/lib/league-nights";
import { getAllClubs } from "@/lib/clubs";
import type { LeagueNightStatus } from "@/lib/db/schema";
import ClubFilter from "@/app/components/ClubFilter";

const STATUS_LABEL: Record<LeagueNightStatus, string> = {
  setup:       "Scheduled",
  in_progress: "In progress",
  completed:   "Completed",
};

const STATUS_COLOR: Record<LeagueNightStatus, string> = {
  setup:       "var(--accent-gold)",
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

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  marginBottom: "8px",
};

interface Props {
  searchParams: Promise<{ club?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  await connection();
  const session = await auth();
  const isSuperAdmin = session?.user.role === "super_admin";
  const clubId = session?.user.clubId ?? null;
  const effectiveClubId = isSuperAdmin ? ((await searchParams).club ?? null) : clubId;

  const [nights, clubs] = await Promise.all([
    getAllLeagueNights(effectiveClubId),
    isSuperAdmin ? getAllClubs() : Promise.resolve([]),
  ]);
  const showClub = isSuperAdmin && !effectiveClubId;

  const upcoming = nights.filter((n) => n.status === "setup");
  const history  = nights.filter((n) => n.status !== "setup");

  function NightTable({ rows }: { rows: typeof nights }) {
    return (
      <div className="mf-table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
              <th style={{ ...thStyle, textAlign: "left" }}>Date</th>
              {showClub && <th style={{ ...thStyle, textAlign: "left" }}>Club</th>}
              <th style={{ ...thStyle, textAlign: "right" }}>Players</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Boards</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Status</th>
              <th style={{ ...thStyle, width: "48px" }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((night) => (
              <tr key={night.id} style={{ height: "64px", borderBottom: "1px solid var(--border-hairline)" }}>
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

                {showClub && (
                  <td style={{ paddingRight: "24px", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)" }}>
                    {night.clubName ?? "—"}
                  </td>
                )}

                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                  {night.attendingPlayerIds.length}
                </td>

                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                  {night.boardCount}
                </td>

                <td style={{ textAlign: "right", fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: STATUS_COLOR[night.status] }}>
                  {STATUS_LABEL[night.status]}
                </td>

                <td style={{ textAlign: "right", paddingLeft: "24px" }}>
                  <Link
                    href={`/league-night/${night.id}`}
                    style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-tertiary)", textDecoration: "none" }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <main className="mf-page">
      <header style={{ marginBottom: "64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "12px" }}>
          Mighty Flights
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1, marginBottom: "24px" }}>
          Season History
        </h1>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      {isSuperAdmin && (
        <ClubFilter clubs={clubs} selected={effectiveClubId} />
      )}

      {nights.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-tertiary)", textAlign: "center", paddingTop: "48px" }}>
          No league nights yet
        </p>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: "56px" }}>
              <p style={sectionLabelStyle}>Upcoming</p>
              <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
              <NightTable rows={upcoming} />
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section>
              <p style={sectionLabelStyle}>History</p>
              <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "24px" }} />
              <NightTable rows={history} />
            </section>
          )}
        </>
      )}
    </main>
  );
}
