import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getPlayerProfile } from "@/lib/leaderboard";
import CopyLinkButton from "./CopyLinkButton";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = ["stats", "partners", "head-to-head"] as const;
type Tab = (typeof TABS)[number];

export default async function PlayerProfilePage({ params, searchParams }: Props) {
  await connection();
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "stats";

  const [session, profile] = await Promise.all([auth(), getPlayerProfile(id)]);
  if (!profile) notFound();

  // Non-super-admin users can only view players in their own club
  if (session?.user.role !== "super_admin") {
    const userClubId = session?.user.clubId ?? null;
    if (profile.player.clubId !== userClubId) notFound();
  }

  const { player, partners, headToHeads } = profile;

  const statBlocks = [
    { label: "Games Played", value: String(player.gamesPlayed) },
    { label: "Wins",         value: String(player.wins) },
    { label: "Losses",       value: String(player.losses) },
    { label: "Win %",         value: (player.winRatio * 100).toFixed(1) + "%" },
    { label: "Doves",        value: "—" },
    { label: "Dove Wins",    value: "—" },
  ];

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

  return (
    <main className="mf-page">
      {/* Back link + copy */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <Link
          href="/leaderboard"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            textDecoration: "none",
          }}
        >
          ← Standings
        </Link>
        <CopyLinkButton />
      </div>

      {/* Hero block */}
      <header style={{ marginBottom: "48px" }}>
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
          {player.name}
        </h1>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      {/* Tab nav */}
      <nav style={{ display: "flex", gap: "32px", marginBottom: "48px", borderBottom: "1px solid var(--border-hairline)" }}>
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/players/${id}?tab=${t}`}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: t === tab ? "var(--ink-primary)" : "var(--ink-tertiary)",
              textDecoration: "none",
              paddingBottom: "12px",
              borderBottom: t === tab ? "2px solid var(--accent-gold)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t === "head-to-head" ? "Head-to-Head" : t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </nav>

      {/* Stats tab */}
      {tab === "stats" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "40px",
              marginBottom: "64px",
            }}
          >
            {statBlocks.map(({ label, value }) => (
              <div key={label}>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(32px, 4vw, 48px)",
                    fontWeight: 400,
                    color: "var(--ink-primary)",
                    lineHeight: 1,
                    marginBottom: "10px",
                  }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-tertiary)",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-tertiary)",
                marginBottom: "8px",
              }}
            >
              Achievements
            </p>
            <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "28px" }} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              {[
                { label: "3 in a Box",    desc: "Three consecutive wins in a night" },
                { label: "Shanghai",      desc: "Win on singles, doubles & triples"  },
                { label: "Max Score",     desc: "Highest single-game score on record" },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  style={{
                    padding: "24px",
                    border: "1px solid var(--border-hairline)",
                    background: "var(--bg-elevated)",
                    position: "relative",
                    opacity: 0.55,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      fontFamily: "var(--font-body)",
                      fontSize: "9px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--accent-gold)",
                      border: "1px solid var(--accent-gold)",
                      padding: "2px 6px",
                    }}
                  >
                    Coming Soon
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "22px",
                      color: "var(--ink-primary)",
                      marginBottom: "6px",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--ink-tertiary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Partners tab */}
      {tab === "partners" && (
        partners.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
            No partner history yet.
          </p>
        ) : (
          <div className="mf-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                <th style={{ ...thStyle, textAlign: "left" }}>Partner</th>
                <th style={{ ...thStyle, textAlign: "right" }}>GP</th>
                <th style={{ ...thStyle, textAlign: "right" }}>W</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Win %</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((row) => (
                <tr
                  key={row.partnerId}
                  style={{
                    height: "52px",
                    borderBottom: "1px solid var(--border-hairline)",
                  }}
                >
                  <td>
                    <Link
                      href={`/players/${row.partnerId}`}
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "20px",
                        fontWeight: 400,
                        color: "var(--ink-primary)",
                        textDecoration: "none",
                      }}
                    >
                      {row.partnerName}
                    </Link>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {row.gamesPlayed}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {row.wins}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {(row.winRatio * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )
      )}

      {/* Head-to-Head tab */}
      {tab === "head-to-head" && (
        headToHeads.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
            No head-to-head history yet.
          </p>
        ) : (
          <div className="mf-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                <th style={{ ...thStyle, textAlign: "left" }}>Opponents</th>
                <th style={{ ...thStyle, textAlign: "right" }}>GP</th>
                <th style={{ ...thStyle, textAlign: "right" }}>W</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Win %</th>
              </tr>
            </thead>
            <tbody>
              {headToHeads.map((row) => (
                <tr
                  key={row.matchupKey}
                  style={{
                    height: "52px",
                    borderBottom: "1px solid var(--border-hairline)",
                  }}
                >
                  <td
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "20px",
                      fontWeight: 400,
                      color: "var(--ink-primary)",
                    }}
                  >
                    {row.opponentNames.join(" & ")}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {row.gamesPlayed}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {row.playerWins}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    {(row.winRatio * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )
      )}
    </main>
  );
}
