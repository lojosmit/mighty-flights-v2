"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Club } from "@/lib/db/schema";

interface Props {
  clubs: Club[];
  selected: string | null;
}

export default function ClubFilter({ clubs, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(clubId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (clubId) {
      params.set("club", clubId);
    } else {
      params.delete("club");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ marginBottom: "40px" }}>
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 14px",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "var(--ink-primary)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-hairline)",
          outline: "none",
          cursor: "pointer",
          minWidth: "200px",
        }}
      >
        <option value="">All clubs</option>
        {clubs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
