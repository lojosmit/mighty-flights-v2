"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LoginDrawer from "@/app/components/LoginDrawer";

function LoginPageInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [open, setOpen] = useState(true);

  useEffect(() => { setOpen(true); }, []);

  return (
    <>
      <LoginDrawer open={open} onClose={() => setOpen(false)} callbackUrl={callbackUrl} />

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-secondary)",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={320}
          height={320}
          priority
          style={{ display: "block", marginBottom: "32px", width: "auto", height: "clamp(180px, 20vw, 320px)" }}
        />
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(48px, 6vw, 84px)",
            fontWeight: 400,
            color: "var(--ink-primary)",
            letterSpacing: "0.02em",
            marginBottom: "12px",
            lineHeight: 1,
          }}
        >
          Mighty Flights
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
          }}
        >
          {new Date().getFullYear()} Season
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
