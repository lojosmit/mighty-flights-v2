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
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-secondary)",
        }}
      >
        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={480}
          height={480}
          priority
          style={{ display: "block", width: "auto", height: "clamp(260px, 30vw, 480px)" }}
        />
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
