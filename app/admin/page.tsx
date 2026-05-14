import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllClubs } from "@/lib/clubs";
import { getPendingRegistrationRequests } from "@/lib/registration-requests";
import CreateClubForm from "./CreateClubForm";
import ResetPasswordForm from "./ResetPasswordForm";
import Link from "next/link";

export default async function AdminPage() {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "super_admin") redirect("/");

  const [clubs, pendingRequests] = await Promise.all([
    getAllClubs(),
    getPendingRegistrationRequests(),
  ]);

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
      <header style={{ marginBottom: "64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent-gold)", marginBottom: "8px" }}>
          Super Admin
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "48px", fontWeight: 400, color: "var(--ink-primary)", lineHeight: 1 }}>
          Administration
        </h1>
      </header>

      {/* My Account */}
      <section style={{ marginBottom: "72px" }}>
        <p style={sectionLabel}>My Account</p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", color: "var(--ink-primary)" }}>
              {session.user.name}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
              {session.user.email} · super_admin
            </div>
          </div>
          <ResetPasswordForm userId={session.user.id} />
        </div>
      </section>

      {/* Pending registration requests */}
      {pendingRequests.length > 0 && (
        <section style={{ marginBottom: "72px" }}>
          <p style={{ ...sectionLabel, color: "var(--loss)" }}>
            Access Requests ({pendingRequests.length})
          </p>
          <div style={{ height: "1px", backgroundColor: "var(--loss)", marginBottom: "24px" }} />
          <div className="mf-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: "640px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                {["Name", "Email", "Requested"].map((h, i) => (
                  <th key={h} style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-tertiary)", paddingBottom: "10px", textAlign: i === 2 ? "right" : "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((r) => (
                <tr key={r.id} style={{ height: "48px", borderBottom: "1px solid var(--border-hairline)" }}>
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
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "16px" }}>
            Generate invite links for these players via the relevant club page below.
          </p>
        </section>
      )}

      {/* Clubs directory */}
      <section style={{ marginBottom: "72px" }}>
        <p style={sectionLabel}>Clubs</p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />

        {clubs.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-tertiary)" }}>
            No clubs yet. Create one below.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "640px" }}>
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/admin/clubs/${club.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 0",
                  borderBottom: "1px solid var(--border-hairline)",
                  textDecoration: "none",
                }}
              >
                <div>
                  <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", color: "var(--ink-primary)" }}>
                    {club.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-tertiary)", marginLeft: "12px" }}>
                    /{club.slug}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                  Manage →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Create club */}
      <section style={{ marginBottom: "72px" }}>
        <p style={sectionLabel}>New Club</p>
        <div style={{ height: "1px", backgroundColor: "var(--accent-gold)", marginBottom: "24px" }} />
        <CreateClubForm />
      </section>
    </main>
  );
}
