import { auth } from "@/auth";
import NavBarShell from "./NavBarShell";

const MANAGER_LINKS = [
  { href: "/leaderboard",      label: "Standings"  },
  { href: "/players",          label: "Players"    },
  { href: "/history",          label: "History"    },
  { href: "/league-night/new", label: "New Night"  },
];

const PLAYER_LINKS = [
  { href: "/leaderboard", label: "Standings" },
  { href: "/history",     label: "History"   },
];

export default async function NavBar() {
  const session = await auth();
  const role = session?.user.role;
  const isManager = role === "super_admin" || role === "club_manager" || role === "host";
  const navLinks = session ? (isManager ? MANAGER_LINKS : PLAYER_LINKS) : [];

  return (
    <NavBarShell
      navLinks={navLinks}
      isAdmin={role === "super_admin"}
      userName={session?.user.name ?? null}
      isLoggedIn={!!session}
    />
  );
}
