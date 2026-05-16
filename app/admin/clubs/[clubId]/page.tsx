import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getClubById } from "@/lib/clubs";
import { getInvitesByClub } from "@/lib/invites";
import { getUsersByClub } from "@/lib/users";
import { getPlayers } from "@/lib/players";
import { getPendingRegistrationRequests } from "@/lib/registration-requests";
import InviteForm from "@/app/admin/InviteForm";
import SearchableMembers from "./SearchableMembers";

interface Props {
  params: Promise<{ clubId: string }>;
}

export default async function ClubPage({ params }: Props) {
  await connection();
  const [session, { clubId }] = await Promise.all([auth(), params]);

  const isSuperAdmin = session?.user.role === "super_admin";
  const isOwnClub = session?.user.role === "club_manager" && session.user.clubId === clubId;
  if (!session || (!isSuperAdmin && !isOwnClub)) redirect("/");

  const [club, members, players, invites, pendingRequests] = await Promise.all([
    getClubById(clubId),
    getUsersByClub(clubId),
    getPlayers(clubId),
    getInvitesByClub(clubId),
    getPendingRegistrationRequests(clubId),
  ]);

  if (!club) notFound();

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    marginBottom: "8px",
  };

  return (
    <main className="mf-page">
      {/* Breadcrumb */}
      <nav style={{ marginBottom: "40px" }}>
        <Link
          href="/admin"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            textDecoration: "none",
          }}
        >
          ← Admin
        </Link>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: "64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent-gold)", marginBottom: "8px" }}>
          Club Management
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "48px", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1 }}>
          {club.name}
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "8px" }}>
          /{club.slug}
        </p>
      </header>

      {/* Pending access requests for this club */}
      {pendingRequests.length > 0 && (
        <section style={{ marginBottom: "64px" }}>
          <p style={{ ...sectionLabel, color: "var(--loss)" }}>
            Access Requests ({pendingRequests.length})
          </p>
          <div style={{ height: "1px", backgroundColor: "var(--loss)", marginBottom: "24px" }} />
          <div className="mf-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                {["Name", "Email", "Date"].map((h, i) => (
                  <th key={h} style={{ ...sectionLabel, textAlign: i === 2 ? "right" : "left", paddingBottom: "10px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((r) => (
                <tr key={r.id} style={{ height: "44px", borderBottom: "1px solid var(--border-hairline)" }}>
                  <td style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "var(--ink-primary)" }}>{r.name}</td>
                  <td style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)" }}>{r.email}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-AU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {/* Player Roster */}
      {players.length > 0 && (
        <section style={{ marginBottom: "64px" }}>
          <p style={sectionLabel}>Player Roster ({players.length})</p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {players.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-hairline)",
                }}
              >
                <div>
                  <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", color: "var(--ink-primary)" }}>
                    {p.name}
                  </span>
                  {p.email && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)", marginLeft: "12px" }}>
                      {p.email}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    Rank {p.seasonRank}
                  </span>
                  {!p.userId && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-gold)" }}>
                      No account
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two-column layout: Members + Invites */}
      <div className="mf-grid-2">
        {/* Members */}
        <section>
          <p style={sectionLabel}>Members ({members.length})</p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
          <SearchableMembers members={members} />
        </section>

        {/* Invite links */}
        <section>
          <p style={sectionLabel}>Generate Invite Link</p>
          <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
          <InviteForm clubId={club.id} />

          {invites.length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <p style={{ ...sectionLabel, marginBottom: "12px" }}>Recent Invites</p>
              {invites.slice(-8).reverse().map((inv) => {
                const expired = new Date(inv.expiresAt) < new Date();
                const used = !!inv.usedAt;
                return (
                  <div
                    key={inv.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border-hairline)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.role} · {inv.token.slice(0, 8)}…
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: used ? "var(--ink-tertiary)" : expired ? "var(--loss)" : "var(--accent-gold)", flexShrink: 0 }}>
                      {used ? "Used" : expired ? "Expired" : "Active"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
