import { Suspense } from "react";
import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left panel — branding */}
      <div
        style={{
          flex: "0 0 55%",
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--accent-gold)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          gap: "0",
        }}
      >
        <Image
          src="/logo.png"
          alt="Mighty Flights"
          width={260}
          height={260}
          priority
          style={{ display: "block", marginBottom: "32px" }}
        />
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "64px",
            fontWeight: 400,
            color: "var(--ink-primary)",
            letterSpacing: "0.02em",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          Mighty Flights
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            marginBottom: "40px",
          }}
        >
          {new Date().getFullYear()} Season
        </p>
        <div
          style={{
            height: "1px",
            width: "64px",
            backgroundColor: "var(--accent-gold)",
            marginBottom: "32px",
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--ink-tertiary)",
            textAlign: "center",
            maxWidth: "300px",
            lineHeight: 1.7,
          }}
        >
          Darts league management for your club — standings, fixtures, and game nights.
        </p>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 64px",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
