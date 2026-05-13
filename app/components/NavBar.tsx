import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/leaderboard",     label: "Standings" },
  { href: "/players",         label: "Players"   },
  { href: "/history",         label: "History"   },
  { href: "/league-night/new", label: "New Night" },
];

export default function NavBar() {
  return (
    <header
      style={{
        width: "100%",
        height: "72px",
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
        href="/leaderboard"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "24px",
          fontWeight: 400,
          color: "var(--ink-primary)",
          textDecoration: "none",
          letterSpacing: "0.02em",
          marginRight: "48px",
          flexShrink: 0,
        }}
      >
        Mighty Flights
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", gap: "32px", flex: 1 }}>
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-tertiary)",
              textDecoration: "none",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right: theme toggle */}
      <ThemeToggle />
    </header>
  );
}
