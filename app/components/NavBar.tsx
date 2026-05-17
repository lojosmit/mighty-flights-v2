import { auth } from "@/auth";
import { getActiveLeagueNight } from "@/lib/league-nights";
import { getLatestRoundNumber } from "@/lib/rounds";
import NavBarShell from "./NavBarShell";

const MANAGER_LINKS = [
  { href: "/leaderboard",      label: "Standings"  },
  { href: "/players",          label: "Players"    },
  { href: "/history",          label: "History"    },
  { href: "/league-night/new", label: "New Game"  },
];

const PLAYER_LINKS = [
  { href: "/leaderboard", label: "Standings" },
  { href: "/players",     label: "Players"   },
  { href: "/history",     label: "History"   },
];

export default async function NavBar() {
  const session = await auth();
  const role = session?.user.role;
  const isManager = role === "super_admin" || role === "club_manager" || role === "host";
  const navLinks = session ? (isManager ? MANAGER_LINKS : PLAYER_LINKS) : [];

  let activeGame: { id: string; roundNumber: number } | null = null;
  if (session) {
    const night = await getActiveLeagueNight();
    if (night) {
      const roundNumber = await getLatestRoundNumber(night.id);
      activeGame = { id: night.id, roundNumber: roundNumber ?? 0 };
    }
  }

  return (
    <NavBarShell
      navLinks={navLinks}
      isAdmin={role === "super_admin"}
      isClubManager={role === "club_manager"}
      clubManagerClubId={session?.user.clubId ?? null}
      userName={session?.user.name ?? null}
      isLoggedIn={!!session}
      activeGame={activeGame}
    />
  );
}
