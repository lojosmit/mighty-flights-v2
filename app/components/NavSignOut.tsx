"use client";

import { signOut } from "next-auth/react";

export default function NavSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        display: "flex",
        alignItems: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink-tertiary)",
        padding: 0,
      }}
    >
      Sign out
    </button>
  );
}
