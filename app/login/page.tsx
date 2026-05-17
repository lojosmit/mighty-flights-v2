"use client";

import { Suspense } from "react";
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
