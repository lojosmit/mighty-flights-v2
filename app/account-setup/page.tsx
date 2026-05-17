import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AccountSetupForm from "./AccountSetupForm";

export default async function AccountSetupPage() {
  await connection();
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user.mustResetPassword) redirect("/");

  return (
    <main className="mf-page" style={{ paddingTop: "clamp(48px, 8vh, 80px)", paddingBottom: "64px" }}>
      <div style={{ maxWidth: "480px" }}>

        <header style={{ marginBottom: "48px" }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            marginBottom: "12px",
          }}>
            First visit
          </p>
          <h1 style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(48px, 6vw, 72px)",
            fontWeight: 400,
            color: "var(--ink-primary)",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}>
            Set up your account
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--ink-tertiary)",
            lineHeight: 1.6,
          }}>
            Welcome, {session.user.name}. Please set your email address and choose a
            password. You&apos;ll use these to sign in from now on.
          </p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginTop: "24px" }} />
        </header>

        <AccountSetupForm currentEmail={session.user.email} />
      </div>
    </main>
  );
}
