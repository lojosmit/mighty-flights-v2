"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LoginDrawer from "@/app/components/LoginDrawer";

function LoginPageInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <LoginDrawer open={open} onClose={() => setOpen(false)} callbackUrl={callbackUrl} />

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(48px, 8vh, 96px)",
          background: "var(--bg-secondary)",
        }}
      >
        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={520}
          height={520}
          priority
          style={{ display: "block", width: "auto", height: "clamp(280px, 36vw, 520px)" }}
        />
        <p
          style={{
            marginTop: "clamp(24px, 4vh, 48px)",
            fontFamily: "var(--font-body)",
            fontSize: "clamp(13px, 1.2vw, 16px)",
            fontWeight: 400,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            textAlign: "center",
          }}
        >
          Darts League Management
        </p>
        <p
          style={{
            marginTop: "12px",
            fontFamily: "var(--font-body)",
            fontSize: "clamp(12px, 1vw, 14px)",
            color: "var(--ink-tertiary)",
            opacity: 0.6,
            letterSpacing: "0.06em",
            textAlign: "center",
          }}
        >
          Sign in to access your club
        </p>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
