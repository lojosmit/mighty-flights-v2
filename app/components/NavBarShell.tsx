"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import NavSignOut from "./NavSignOut";

interface NavLink { href: string; label: string; }

interface Props {
  navLinks: NavLink[];
  isAdmin: boolean;
  userName: string | null;
  isLoggedIn: boolean;
}

export default function NavBarShell({ navLinks, isAdmin, userName, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
          {isAdmin && (
            <Link
              href="/admin"
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
          <span className="mf-navbar-username">{userName}</span>
          <ThemeToggle />
          {isLoggedIn ? (
            <NavSignOut />
          ) : (
            <Link href="/login" style={linkStyle}>Sign in</Link>
          )}

          {/* Hamburger */}
          <button
            className="mf-hamburger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span
              className="mf-hamburger-line"
              style={open ? { transform: "translateY(7px) rotate(45deg)" } : undefined}
            />
            <span
              className="mf-hamburger-line"
              style={open ? { opacity: 0 } : undefined}
            />
            <span
              className="mf-hamburger-line"
              style={open ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined}
            />
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      {open && (
        <div className="mf-mobile-menu" role="dialog" aria-label="Navigation menu">
          {/* Header row matching navbar height */}
          <div className="mf-mobile-menu-header">
            <Link href="/" className="mf-navbar-brand" onClick={() => setOpen(false)}>
              <Image src="/logo.png" alt="" width={40} height={40} style={{ display: "block" }} />
              <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "var(--ink-primary)", letterSpacing: "0.02em" }}>
                Mighty Flights
              </span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--ink-tertiary)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
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
            {isAdmin && (
              <Link href="/admin" className="mf-mobile-nav-item" style={{ color: "var(--accent-gold)" }}>
                Admin
              </Link>
            )}
            {!isLoggedIn && (
              <Link href="/login" className="mf-mobile-nav-item">
                Sign in
              </Link>
            )}
          </nav>

          {/* Footer: user info + theme + sign out */}
          <div className="mf-mobile-menu-footer">
            <div>
              {userName && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-secondary)", marginBottom: "4px" }}>
                  {userName}
                </p>
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
