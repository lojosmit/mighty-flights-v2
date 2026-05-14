import { connection } from "next/server";
import { getHandicapTable } from "@/lib/handicap";
import { HandicapTable } from "./components/HandicapTable";

export default async function HandicapSettingsPage() {
  await connection();
  const rows = await getHandicapTable();

  return (
    <main className="mf-page">
      <header className="mb-16">
        <p
          className="text-meta uppercase tracking-widest mb-3"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Settings
        </p>
        <h1
          className="text-h1"
          style={{ fontFamily: "var(--font-cormorant)", color: "var(--ink-primary)" }}
        >
          Handicap Multipliers
        </h1>
        <div className="mt-4 h-px w-full" style={{ backgroundColor: "var(--border-hairline)" }} />
        <p className="mt-6 text-body" style={{ color: "var(--ink-secondary)", maxWidth: "480px" }}>
          Applied to in-game score only. Bonus points for special wins are always flat +1 and are never multiplied.
        </p>
      </header>

      <HandicapTable rows={rows} />
    </main>
  );
}
