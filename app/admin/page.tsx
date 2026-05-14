import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllClubs } from "@/lib/clubs";
import { getInvitesByClub } from "@/lib/invites";
import { getUsersByClub } from "@/lib/users";
import CreateClubForm from "./CreateClubForm";
import InviteForm from "./InviteForm";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function AdminPage() {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "super_admin") redirect("/");

  const clubs = await getAllClubs();

  const clubsWithData = await Promise.all(
    clubs.map(async (club) => ({
      club,
      invites: await getInvitesByClub(club.id),
      members: await getUsersByClub(club.id),
    }))
  );

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
    paddingBottom: "10px",
    textAlign: "left",
  };

  return (
    <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 80px" }}>
      <header style={{ marginBottom: "64px" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            marginBottom: "8px",
          }}
        >
          Super Admin
        </p>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "48px",
            fontWeight: 400,
            color: "var(--ink-primary)",
            lineHeight: 1,
          }}
        >
          Club Management
        </h1>
      </header>

      {/* Create club */}
      <section style={{ marginBottom: "72px" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
            marginBottom: "8px",
          }}
        >
          New Club
        </p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
        <CreateClubForm />
      </section>

      {/* Clubs */}
      {clubsWithData.map(({ club, invites, members }) => (
        <section
          key={club.id}
          style={{
            marginBottom: "72px",
            borderTop: "1px solid var(--border-hairline)",
            paddingTop: "48px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "40px" }}>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                }}
              >
                {club.name}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-tertiary)" }}>
                /{club.slug}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px" }}>
            {/* Members */}
            <div>
              <p style={{ ...thStyle, marginBottom: "16px" }}>Members ({members.length})</p>
              {members.length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
                  No members yet.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                      <th style={thStyle}>Name</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Role</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Reset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} style={{ height: "48px", borderBottom: "1px solid var(--border-hairline)" }}>
                        <td>
                          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "var(--ink-primary)" }}>
                            {m.name}
                          </div>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                            {m.email}
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-secondary)" }}>
                          {m.role}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <ResetPasswordForm userId={m.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Invite links */}
            <div>
              <p style={{ ...thStyle, marginBottom: "16px" }}>Generate Invite</p>
              <InviteForm clubId={club.id} />

              {invites.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <p style={{ ...thStyle, marginBottom: "12px" }}>Recent Invites</p>
                  {invites.slice(-5).reverse().map((inv) => {
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
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--ink-tertiary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {inv.role} · {inv.token.slice(0, 8)}…
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "10px",
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: used ? "var(--ink-tertiary)" : expired ? "var(--loss)" : "var(--accent-gold)",
                          }}
                        >
                          {used ? "Used" : expired ? "Expired" : "Active"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
