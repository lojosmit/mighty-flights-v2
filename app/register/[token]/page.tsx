import { notFound } from "next/navigation";
import { getValidInviteToken } from "@/lib/invites";
import { getClubById } from "@/lib/clubs";
import RegisterForm from "./RegisterForm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { token } = await params;

  const invite = await getValidInviteToken(token);
  if (!invite) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-primary)",
          padding: "40px 24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent-gold)",
              marginBottom: "16px",
            }}
          >
            Invalid Link
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "36px",
              fontWeight: 400,
              color: "var(--ink-primary)",
              marginBottom: "16px",
            }}
          >
            This invite has expired
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-secondary)" }}>
            Ask your club manager for a new invite link.
          </p>
        </div>
      </main>
    );
  }

  const club = await getClubById(invite.clubId);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
        padding: "40px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent-gold)",
              marginBottom: "12px",
            }}
          >
            {club?.name ?? "Mighty Flights"} · {invite.role.replace("_", " ")}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 400,
              color: "var(--ink-primary)",
              lineHeight: 1,
              marginBottom: "16px",
            }}
          >
            Create your account
          </h1>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)" }} />
        </div>

        <RegisterForm token={token} />
      </div>
    </main>
  );
}
