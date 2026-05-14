import { connection } from "next/server";
import { auth } from "@/auth";
import { getPlayers } from "@/lib/players";
import { getAllClubs } from "@/lib/clubs";
import { PlayerList } from "./components/PlayerList";

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  marginBottom: "8px",
};

export default async function PlayersPage() {
  await connection();
  const session = await auth();
  const isSuperAdmin = session?.user.role === "super_admin";
  const clubId = session?.user.clubId ?? null;

  return (
    <main className="mf-page">
      <header className="mb-16">
        <p className="text-meta uppercase tracking-widest text-ink-tertiary mb-3">
          Mighty Flights
        </p>
        <h1
          className="text-h1 font-display"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Player Roster
        </h1>
        <div
          className="mt-4 h-px w-full"
          style={{ backgroundColor: "var(--border-hairline)" }}
        />
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
            clubs.map(async (club) => ({ club, players: await getPlayers(club.id) }))
          );
          return (
            <>
              {clubData.map(({ club, players }) => (
                <section key={club.id} style={{ marginBottom: "64px" }}>
                  <p style={sectionLabelStyle}>{club.name}</p>
                  <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
                  <PlayerList players={players} />
                </section>
              ))}
            </>
          );
        })()
      ) : (
        // ── Player / club manager: single club ───────────────────────────────
        <PlayerList players={await getPlayers(clubId)} />
      )}
    </main>
  );
}
