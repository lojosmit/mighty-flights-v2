"use client";

import { useState, useTransition } from "react";
import { addPayment, deletePayment, setMembershipType } from "@/lib/payments";
import type { PlayerPaymentSummary } from "@/lib/payments";
import type { MembershipType } from "@/lib/db/schema";

interface Props {
  member: PlayerPaymentSummary;
  season: string;
  paymentLog: { id: string; amountRands: number; paidDate: Date; notes: string | null }[];
}

export default function PaymentRow({ member, season, paymentLog }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const balanceColor =
    member.balance > 0 ? "var(--win)" : member.balance < 0 ? "#c0392b" : "var(--ink-tertiary)";

  const label: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-tertiary)",
  };

  function handleAddPayment() {
    const rands = parseInt(amount, 10);
    if (!rands || rands <= 0) return;
    startTransition(async () => {
      await addPayment({ playerId: member.id, amountRands: rands, season, notes: notes || undefined });
      setAmount("");
      setNotes("");
    });
  }

  function handleDeletePayment(id: string) {
    startTransition(async () => {
      await deletePayment(id);
    });
  }

  function handleMembershipChange(type: MembershipType) {
    startTransition(async () => {
      await setMembershipType(member.id, type);
    });
  }

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-hairline)",
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      {/* Summary row */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 110px 90px 90px 90px",
          alignItems: "center",
          padding: "14px 0",
          cursor: "pointer",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ink-primary)",
              fontWeight: 500,
            }}
          >
            {member.name}
          </span>
          <span style={{ ...label, fontSize: "9px" }}>
            {member.gamesAttended} game{member.gamesAttended !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Membership type toggle */}
        <div style={{ display: "flex", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
          {(["annual", "per_game"] as MembershipType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleMembershipChange(t)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "2px 6px",
                background: "transparent",
                border: "1px solid",
                borderColor: member.membershipType === t ? "var(--accent-gold)" : "var(--border-hairline)",
                color: member.membershipType === t ? "var(--accent-gold)" : "var(--ink-tertiary)",
                cursor: "pointer",
              }}
            >
              {t === "annual" ? "Annual" : "Per game"}
            </button>
          ))}
        </div>

        <span style={{ ...label, textAlign: "right" }}>R{member.amountOwed}</span>
        <span style={{ ...label, textAlign: "right" }}>R{member.amountPaid}</span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 600,
            textAlign: "right",
            color: balanceColor,
          }}
        >
          {member.balance >= 0 ? `+R${member.balance}` : `−R${Math.abs(member.balance)}`}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 0 20px 0" }}>
          {/* Payment log */}
          {paymentLog.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              {paymentLog.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--border-hairline)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ink-secondary)" }}>
                    R{p.amountRands}
                    {p.notes && (
                      <span style={{ color: "var(--ink-tertiary)", marginLeft: "8px" }}>{p.notes}</span>
                    )}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ ...label, fontSize: "9px" }}>
                      {new Date(p.paidDate).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      style={{
                        ...label,
                        fontSize: "9px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#c0392b",
                        padding: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add payment */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <p style={{ ...label, fontSize: "9px", marginBottom: "4px" }}>Amount (R)</p>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  width: "80px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--ink-primary)",
                  padding: "6px 8px",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <p style={{ ...label, fontSize: "9px", marginBottom: "4px" }}>Note (optional)</p>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. cash on game day"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  width: "180px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--ink-primary)",
                  padding: "6px 8px",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={handleAddPayment}
              disabled={!amount || isPending}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 16px",
                background: "var(--accent-primary)",
                color: "#fff",
                border: "none",
                cursor: !amount || isPending ? "not-allowed" : "pointer",
                opacity: !amount || isPending ? 0.5 : 1,
              }}
            >
              Record payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
