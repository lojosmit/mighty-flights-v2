"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import NavSignOut from "./NavSignOut";
import LoginDrawer from "./LoginDrawer";

interface NavLink { href: string; label: string; }

interface Props {
  navLinks: NavLink[];
  isAdmin: boolean;
  isClubManager: boolean;
  clubManagerClubId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
}

export default function NavBarShell({ navLinks, isAdmin, isClubManager, clubManagerClubId, userName, isLoggedIn }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMenuOpen(false); setLoginOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const linkStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    textDecoration: "none",
  };

  const adminHref = isClubManager && clubManagerClubId ? `/admin/clubs/${clubManagerClubId}` : "/admin";

  const avatarInitials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <>
      <header className="mf-navbar">
        {/* Brand */}
        <Link href="/" className="mf-navbar-brand">
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            style={{ display: "block", flexShrink: 0, width: "auto", height: "clamp(36px, 5vw, 56px)" }}
          />
          <span className="mf-navbar-title">Mighty Flights</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="mf-navbar-links">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="mf-navbar-link"
                style={isActive ? { color: "var(--ink-primary)", borderBottom: "2px solid var(--accent-gold)", paddingBottom: "2px" } : undefined}
              >
                {label}
              </Link>
            );
          })}
          {(isAdmin || isClubManager) && (
            <Link
              href={adminHref}
              className="mf-navbar-link"
              style={{
                color: pathname.startsWith("/admin") ? "var(--ink-primary)" : "var(--accent-gold)",
                ...(pathname.startsWith("/admin") ? { borderBottom: "2px solid var(--accent-gold)", paddingBottom: "2px" } : {}),
              }}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right */}
        <div className="mf-navbar-right">
          {userName && (
            <Link href="/profile" className="mf-navbar-username">
              <span className="mf-navbar-avatar">{avatarInitials}</span>
              <span>{userName}</span>
            </Link>
          )}
          <ThemeToggle />
          <span className="mf-navbar-desktop-only">
            {isLoggedIn ? (
              <NavSignOut />
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Sign in
              </button>
            )}
          </span>

          {/* Hamburger */}
          <button
            className="mf-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className="mf-hamburger-line" style={menuOpen ? { transform: "translateY(7px) rotate(45deg)" } : undefined} />
            <span className="mf-hamburger-line" style={menuOpen ? { opacity: 0 } : undefined} />
            <span className="mf-hamburger-line" style={menuOpen ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined} />
          </button>
        </div>
      </header>

      {/* Login drawer */}
      {!isLoggedIn && (
        <LoginDrawer open={loginOpen} onClose={() => setLoginOpen(false)} />
      )}

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="mf-mobile-menu" role="dialog" aria-label="Navigation menu">
          <div className="mf-mobile-menu-header">
            <Link href="/" className="mf-navbar-brand" onClick={() => setMenuOpen(false)}>
              <Image src="/logo.png" alt="" width={40} height={40} style={{ display: "block" }} />
              <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "var(--ink-primary)", letterSpacing: "0.02em" }}>
                Mighty Flights
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--ink-tertiary)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>
          </div>

          <nav className="mf-mobile-menu-links">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className="mf-mobile-nav-item"
                  style={isActive ? { color: "var(--accent-gold)" } : undefined}
                >
                  {label}
                </Link>
              );
            })}
            {(isAdmin || isClubManager) && (
              <Link
                href={adminHref}
                className="mf-mobile-nav-item"
                style={pathname.startsWith("/admin") ? { color: "var(--accent-gold)" } : undefined}
              >
                Admin
              </Link>
            )}
            {!isLoggedIn && (
              <button
                onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                className="mf-mobile-nav-item"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                Sign in
              </button>
            )}
          </nav>

          <div className="mf-mobile-menu-footer">
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {userName && (
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--ink-primary)", textDecoration: "none" }}
                >
                  {userName}
                </Link>
              )}
              {isLoggedIn && <NavSignOut />}
            </div>
            <ThemeToggle />
          </div>
        </div>
      )}
    </>
  );
}
