"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { consumeInviteAndRegister } from "@/lib/invites";

export default function RegisterForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const result = await consumeInviteAndRegister({
        token,
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Auto-login after registration
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/");
      router.refresh();
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

  const fields: { key: keyof typeof form; label: string; type: string; auto: string }[] = [
    { key: "name",     label: "Full name",       type: "text",     auto: "name" },
    { key: "email",    label: "Email",            type: "email",    auto: "email" },
    { key: "password", label: "Password",         type: "password", auto: "new-password" },
    { key: "confirm",  label: "Confirm password", type: "password", auto: "new-password" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(({ key, label, type, auto }) => (
        <div key={key} style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={set(key)}
            required
            autoComplete={auto}
            style={inputStyle}
          />
        </div>
      ))}

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
        {isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
