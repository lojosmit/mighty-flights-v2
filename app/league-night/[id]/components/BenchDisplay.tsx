"use client";

interface Props {
  bench: string[];
  playerMap: Record<string, string>;
  selectedPlayerId: string | null;
  onPlayerClick: (id: string) => void;
}

export default function BenchDisplay({
  bench,
  playerMap,
  selectedPlayerId,
  onPlayerClick,
}: Props) {
  if (bench.length === 0) return null;

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-hairline)",
        paddingTop: "32px",
        marginTop: "48px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          marginBottom: "16px",
        }}
      >
        Bench
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        {bench.map((id) => {
          const isSelected = selectedPlayerId === id;
          return (
            <button
              key={id}
              onClick={() => onPlayerClick(id)}
              aria-pressed={isSelected}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                background: "var(--bg-elevated)",
                border: `1px solid ${isSelected ? "var(--accent-gold)" : "var(--border-hairline)"}`,
                padding: "10px 16px",
                cursor: "pointer",
                transition: "border-color 150ms ease",
                outline: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "20px",
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: isSelected ? "var(--accent-gold)" : "var(--ink-primary)",
                  transition: "color 150ms ease",
                }}
              >
                {playerMap[id] ?? "—"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                  marginTop: "2px",
                }}
              >
                plays next round
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
