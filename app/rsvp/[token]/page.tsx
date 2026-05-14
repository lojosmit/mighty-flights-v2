import { auth } from "@/auth";
import { getLeagueNightByRsvpToken, getRsvpsForNight } from "@/lib/rsvp";
import RsvpButton from "./RsvpButton";
import RequestAccessForm from "./RequestAccessForm";

interface Props {
  params: Promise<{ token: string }>;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function RsvpPage({ params }: Props) {
  const { token } = await params;
  const session = await auth();

  const night = await getLeagueNightByRsvpToken(token);

  if (!night) {
    return (
      <main
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-gold)", marginBottom: "16px" }}>
            Invalid Link
          </p>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "36px", fontWeight: 400, color: "var(--ink-primary)" }}>
            This RSVP link is not valid.
          </h1>
        </div>
      </main>
    );
  }

  const deadlineExpired = night.rsvpDeadline && new Date(night.rsvpDeadline) < new Date();
  const rsvps = await getRsvpsForNight(night.id);
  const hasRsvped = session ? rsvps.some((r) => r.userId === session.user.id) : false;

  return (
    <main
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
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
          League Night · RSVP
        </p>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 400,
            color: "var(--ink-primary)",
            lineHeight: 1,
            marginBottom: "16px",
          }}
        >
          {formatDate(night.date)}
        </h1>

        {night.rsvpDeadline && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: deadlineExpired ? "var(--loss)" : "var(--ink-secondary)",
              marginBottom: "8px",
            }}
          >
            {deadlineExpired
              ? "RSVP deadline has passed."
              : `RSVP by ${formatDate(night.rsvpDeadline)}`}
          </p>
        )}

        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-tertiary)", marginBottom: "40px" }}>
          {rsvps.length} {rsvps.length === 1 ? "player" : "players"} attending
        </p>

        <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", marginBottom: "40px" }} />

        {session ? (
          hasRsvped ? (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--accent-gold)", fontWeight: 500 }}>
              You&apos;re in for this night.
            </p>
          ) : deadlineExpired ? (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-tertiary)" }}>
              The RSVP window is closed.
            </p>
          ) : (
            <RsvpButton leagueNightId={night.id} userId={session.user.id} />
          )
        ) : (
          <RequestAccessForm leagueNightId={night.id} clubId={night.clubId ?? undefined} />
        )}
      </div>
    </main>
  );
}
