"use client";

import { useEffect, Suspense } from "react";
import Image from "next/image";
import LoginForm from "@/app/login/LoginForm";

interface Props {
  open: boolean;
  onClose: () => void;
  callbackUrl?: string;
}

export default function LoginDrawer({ open, onClose, callbackUrl }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`mf-login-backdrop${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`mf-login-drawer${open ? " open" : ""}`}
        role="dialog"
        aria-label="Sign in"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-tertiary)",
            padding: "8px",
            lineHeight: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={120}
          height={120}
          style={{ display: "block", marginBottom: "20px", width: "auto", height: "120px" }}
        />
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(28px, 3vw, 40px)",
            fontWeight: 400,
            color: "var(--ink-primary)",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          Mighty Flights
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            marginBottom: "40px",
          }}
        >
          {new Date().getFullYear()} Season
        </p>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <Suspense fallback={null}>
            <LoginForm callbackUrl={callbackUrl} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
