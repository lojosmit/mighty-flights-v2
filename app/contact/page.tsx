"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/validate";

type Status = "idle" | "submitting" | "success" | "error";

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  display: "block",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  color: "var(--ink-primary)",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-hairline)",
  padding: "12px 14px",
  outline: "none",
  borderRadius: 0,
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="mf-page">
      <header style={{ marginBottom: "64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-tertiary)", marginBottom: "12px" }}>
          Mighty Flights
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1, marginBottom: "24px" }}>
          Contact
        </h1>
        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)" }} />
      </header>

      <div style={{ maxWidth: "560px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-secondary)", lineHeight: 1.6, marginBottom: "48px" }}>
          Have a question, found a bug, or want to suggest a feature? Send a message and the developer will get back to you.
        </p>

        {status === "success" ? (
          <div style={{ padding: "32px", border: "1px solid var(--border-hairline)", background: "var(--bg-elevated)", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "28px", color: "var(--ink-primary)", marginBottom: "12px" }}>
              Message sent
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
              Thanks — we&apos;ll be in touch soon.
            </p>
            <button
              onClick={() => setStatus("idle")}
              style={{ marginTop: "24px", fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", background: "none", border: "1px solid var(--border-hairline)", padding: "10px 24px", cursor: "pointer" }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Describe your question or issue…"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            {status === "error" && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--loss)" }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                alignSelf: "flex-start",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "14px 40px",
                background: status === "submitting" ? "var(--border-hairline)" : "var(--accent-primary)",
                color: status === "submitting" ? "var(--ink-tertiary)" : "#ffffff",
                border: "none",
                cursor: status === "submitting" ? "default" : "pointer",
              }}
            >
              {status === "submitting" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
