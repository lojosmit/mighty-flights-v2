"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { completeAccountSetup } from "@/lib/users";
import { isValidEmail } from "@/lib/validate";

export default function AccountSetupForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await completeAccountSetup(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      await signOut({ callbackUrl: "/login" });
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

  const eyeBtn: React.CSSProperties = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--ink-tertiary)",
    padding: "4px",
    lineHeight: 0,
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "440px" }}>
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>New password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            style={{ ...inputStyle, paddingRight: "48px" }}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} style={eyeBtn}>
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <label style={labelStyle}>Confirm password</label>
        <input
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--loss)", marginBottom: "16px" }}>
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
        {isPending ? "Saving…" : "Save & continue"}
      </button>
    </form>
  );
}
