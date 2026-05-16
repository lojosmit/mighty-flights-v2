"use client";

import { useEffect, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import LoginForm from "@/app/login/LoginForm";

interface Props {
  open: boolean;
  onClose: () => void;
  callbackUrl?: string;
}

function DrawerContent({ open, onClose, callbackUrl }: Props) {
  return (
    <>
      {/* Drawer panel — rendered via portal so it sits outside #mf-page-wrap */}
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
          width={200}
          height={200}
          style={{ display: "block", marginBottom: "32px", width: "auto", height: "clamp(140px, 16vw, 200px)" }}
        />

        <div style={{ width: "100%", maxWidth: "420px" }}>
          <Suspense fallback={null}>
            <LoginForm callbackUrl={callbackUrl} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default function LoginDrawer({ open, onClose, callbackUrl }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Drive the page-push via a data attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-login-open", open ? "true" : "false");
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.removeAttribute("data-login-open");
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <DrawerContent open={open} onClose={onClose} callbackUrl={callbackUrl} />,
    document.body
  );
}
