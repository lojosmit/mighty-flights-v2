"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LoginDrawer from "@/app/components/LoginDrawer";

function LoginPageInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <>
      <LoginDrawer open={open} onClose={() => setOpen(false)} callbackUrl={callbackUrl} />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(24px, 4vh, 48px)",
        paddingBottom: "clamp(80px, 16vh, 160px)",
        paddingLeft: "clamp(20px, 6vw, 48px)",
        paddingRight: "clamp(20px, 6vw, 48px)",
          background: "var(--bg-secondary)",
        }}
      >
        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={1200}
          height={1200}
          priority
          style={{ display: "block", width: "min(960px, 85vw)", height: "auto", marginBottom: "48px" }}
        />

        <button
          onClick={() => setOpen(true)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "14px 40px",
            background: "var(--accent-primary)",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
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
