import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getPlayerProfile } from "@/lib/leaderboard";
import ResetPasswordForm from "@/app/admin/ResetPasswordForm";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  club_manager: "Club Manager",
  host: "Host",
  player: "Player",
};

export default async function ProfilePage() {
  await connection();
  const session = await auth();
  if (!session) redirect("/login");

  const [userRow] = await db
    .select({ playerId: users.playerId })
    .from(users)
    .where(eq(users.id, session.user.id));

  const profile = userRow?.playerId ? await getPlayerProfile(userRow.playerId) : null;
  const player = profile?.player ?? null;

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    marginBottom: "8px",
  };

  const statBlocks = player
    ? [
        { label: "Games Played", value: String(player.gamesPlayed) },
        { label: "Wins",         value: String(player.wins) },
        { label: "Losses",       value: String(player.losses) },
        { label: "Win Ratio",    value: player.winRatio.toFixed(3) },
        { label: "Doves",        value: String(player.doves) },
        { label: "Dove Wins",    value: String(player.doveWins) },
      ]
    : [];

  return (
    <main className="mf-page">
      {/* Header */}
      <header style={{ marginBottom: "64px" }}>
        <p style={{ ...sectionLabel, color: "var(--accent-gold)", marginBottom: "12px" }}>
          {ROLE_LABEL[session.user.role] ?? session.user.role}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(48px, 6vw, 72px)",
            fontWeight: 400,
            color: "var(--ink-primary)",
            lineHeight: 1,
            marginBottom: "8px",
          }}
        >
          {session.user.name}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
          {session.user.email}
          {player && (
            <span style={{ marginLeft: "12px" }}>
              · Rank {player.seasonRank}
            </span>
          )}
        </p>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginTop: "24px" }} />
      </header>

      {/* Season stats */}
      {player && (
        <section style={{ marginBottom: "72px" }}>
          <p style={sectionLabel}>Season Stats</p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "32px" }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "40px",
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
                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      <section style={{ marginBottom: "72px" }}>
        <p style={sectionLabel}>Achievements</p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "28px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
          {[
            { label: "3 in a Box",  desc: "Three consecutive wins in a night" },
            { label: "Shanghai",    desc: "Win on singles, doubles & triples"  },
            { label: "Max Score",   desc: "Highest single-game score on record" },
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
              <span style={{ position: "absolute", top: "12px", right: "12px", fontFamily: "var(--font-body)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gold)", border: "1px solid var(--accent-gold)", padding: "2px 6px" }}>
                Coming Soon
              </span>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", color: "var(--ink-primary)", marginBottom: "6px" }}>{label}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Full profile link */}
      {player && userRow?.playerId && (
        <section style={{ marginBottom: "72px" }}>
          <p style={sectionLabel}>Career History</p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
          <Link
            href={`/players/${userRow.playerId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-secondary)",
              textDecoration: "none",
              border: "1px solid var(--border-hairline)",
              padding: "12px 20px",
            }}
          >
            View full stats, partners & head-to-head →
          </Link>
        </section>
      )}

      {/* Account settings */}
      <section>
        <p style={sectionLabel}>Account</p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-secondary)" }}>
              Change Password
            </p>
          </div>
          <ResetPasswordForm userId={session.user.id} />
        </div>
      </section>
    </main>
  );
}
