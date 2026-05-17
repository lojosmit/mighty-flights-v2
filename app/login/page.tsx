"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LoginForm from "./LoginForm";

function LoginPageInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(40px, 6vh, 80px) clamp(20px, 6vw, 48px)",
        background: "var(--bg-secondary)",
      }}
    >
      <Image
        src="/logo.png"
        alt="Mighty Flights"
        width={220}
        height={220}
        priority
        style={{ display: "block", width: "min(220px, 50vw)", height: "auto", marginBottom: "40px" }}
      />
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
