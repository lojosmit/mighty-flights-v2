import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllClubs } from "@/lib/clubs";
import { getSeasonFinancials, getPlayerPaymentLog } from "@/lib/payments";
import PaymentRow from "./PaymentRow";

const CURRENT_SEASON = new Date().getFullYear().toString();

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; season?: string }>;
}) {
  await connection();
  const session = await auth();
  if (session?.user.role !== "super_admin") redirect("/");

  const { club: clubId, season = CURRENT_SEASON } = await searchParams;

  const clubs = await getAllClubs();
  const activeClubId = clubId ?? clubs[0]?.id;
  const activeClub = clubs.find((c) => c.id === activeClubId);

  const financials = activeClubId
    ? await getSeasonFinancials(activeClubId, season)
    : null;

  const paymentLogs = financials
    ? await Promise.all(
        financials.members.map((m) =>
          getPlayerPaymentLog(m.id, season).then((log) => ({ playerId: m.id, log }))
        )
      )
    : [];

  const logMap = Object.fromEntries(paymentLogs.map((p) => [p.playerId, p.log]));

  const label: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
  };

  const overdue = financials?.members.filter((m) => m.balance < 0) ?? [];
  const paidUp = financials?.members.filter((m) => m.balance >= 0) ?? [];

  return (
    <main className="mf-page">
      <header style={{ marginBottom: "40px" }}>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "5vw",
            fontWeight: 400,
            color: "var(--ink-primary)",
            marginBottom: "24px",
          }}
        >
          Finances
        </h1>

        {/* Club + season selectors */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {clubs.map((c) => (
            <a
              key={c.id}
              href={`/admin/payments?club=${c.id}&season=${season}`}
              style={{
                ...label,
                textDecoration: "none",
                color: c.id === activeClubId ? "var(--ink-primary)" : "var(--ink-tertiary)",
                borderBottom: c.id === activeClubId ? "1px solid var(--ink-primary)" : "none",
                paddingBottom: "2px",
              }}
            >
              {c.name}
            </a>
          ))}
          <span style={{ color: "var(--border-hairline)" }}>·</span>
          {["2025", "2026", "2027"].map((y) => (
            <a
              key={y}
              href={`/admin/payments?club=${activeClubId}&season=${y}`}
              style={{
                ...label,
                textDecoration: "none",
                color: y === season ? "var(--ink-primary)" : "var(--ink-tertiary)",
                borderBottom: y === season ? "1px solid var(--ink-primary)" : "none",
                paddingBottom: "2px",
              }}
            >
              {y}
            </a>
          ))}
        </div>
      </header>

      {financials && (
        <>
          {/* Kitty */}
          <div
            style={{
              display: "flex",
              gap: "48px",
              marginBottom: "48px",
              padding: "24px 32px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-hairline)",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ ...label, marginBottom: "6px" }}>Club Kitty · {season}</p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "40px",
                  color: "var(--accent-gold)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                R{financials.kittyTotal.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ ...label, marginBottom: "6px" }}>Overdue</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "40px", color: "#c0392b", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {overdue.length}
              </p>
            </div>
            <div>
              <p style={{ ...label, marginBottom: "6px" }}>Paid up</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "40px", color: "var(--win)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {paidUp.length}
              </p>
            </div>
            <div>
              <p style={{ ...label, marginBottom: "6px" }}>Total outstanding</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "40px", color: "#c0392b", letterSpacing: "-0.02em", lineHeight: 1 }}>
                R{Math.abs(overdue.reduce((sum, m) => sum + m.balance, 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 90px 90px 90px",
              gap: "8px",
              padding: "0 0 8px",
              borderBottom: "1px solid var(--border-hairline)",
              marginBottom: "4px",
            }}
          >
            <span style={label}>Member</span>
            <span style={label}>Type</span>
            <span style={{ ...label, textAlign: "right" }}>Owed</span>
            <span style={{ ...label, textAlign: "right" }}>Paid</span>
            <span style={{ ...label, textAlign: "right" }}>Balance</span>
          </div>

          {/* Member rows */}
          {financials.members.map((m) => (
            <PaymentRow
              key={m.id}
              member={m}
              season={season}
              paymentLog={logMap[m.id] ?? []}
            />
          ))}
        </>
      )}

      {!activeClubId && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--ink-tertiary)" }}>
          No clubs found.
        </p>
      )}
    </main>
  );
}
