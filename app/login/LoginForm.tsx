"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Incorrect email or password.");
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    color: "var(--ink-primary)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-hairline)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    marginBottom: "8px",
  };

  return (
    <div style={{ width: "100%", maxWidth: "440px" }}>
      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            marginBottom: "8px",
          }}
        >
          Member Login
        </p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)" }} />
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--loss)",
              marginBottom: "16px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: isPending ? "var(--ink-tertiary)" : "var(--accent-primary)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
