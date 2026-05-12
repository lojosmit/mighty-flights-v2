// Placeholder — built in Phase 7 (Round Flow).
export default function LeagueNightPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-[1280px] mx-auto px-20 py-16">
      <p
        className="text-meta uppercase tracking-widest mb-3"
        style={{ color: "var(--ink-tertiary)" }}
      >
        League Night
      </p>
      <h1
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "3rem",
          color: "var(--ink-primary)",
        }}
      >
        Setup complete
      </h1>
      <p className="mt-6 text-body" style={{ color: "var(--ink-secondary)" }}>
        Round generation coming in Phase 5. Night ID: {params.id}
      </p>
    </main>
  );
}
