import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import ThemeToggle from "./ThemeToggle";
import NavSignOut from "./NavSignOut";

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
  const navLinks = isManager ? MANAGER_LINKS : PLAYER_LINKS;

  const linkStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    textDecoration: "none",
  };

  return (
    <header
      style={{
        width: "100%",
        height: "88px",
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--accent-gold)",
        display: "flex",
        alignItems: "center",
        padding: "0 80px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          marginRight: "48px",
          flexShrink: 0,
        }}
      >
        <Image
          src="/logo.png"
          alt=""
          width={56}
          height={56}
          style={{ display: "block", flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "30px",
            fontWeight: 400,
            color: "var(--ink-primary)",
            letterSpacing: "0.02em",
          }}
        >
          Mighty Flights
        </span>
      </Link>

      {/* Nav links — only shown when authenticated */}
      <nav style={{ display: "flex", gap: "32px", flex: 1 }}>
        {session && navLinks.map(({ href, label }) => (
          <Link key={href} href={href} style={linkStyle}>
            {label}
          </Link>
        ))}
        {role === "super_admin" && (
          <Link
            href="/admin"
            style={{ ...linkStyle, color: "var(--accent-gold)" }}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Right: user + theme + sign-in/sign-out */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {session?.user.name && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--ink-tertiary)",
              letterSpacing: "0.04em",
            }}
          >
            {session.user.name}
          </span>
        )}
        <ThemeToggle />
        {session ? (
          <NavSignOut />
        ) : (
          <Link href="/login" style={linkStyle}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
