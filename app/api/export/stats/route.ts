import { connection } from "next/server";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";
import { sortLeaderboard } from "@/lib/leaderboard-utils";

export async function GET() {
  await connection();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clubId = session.user.role === "super_admin" ? null : session.user.clubId;
  const entries = await getLeaderboard(clubId);
  const sorted = sortLeaderboard(entries, "wins", "desc");

  const header = ["Rank", "Name", "GP", "W", "L", "D", "D+", "Win Ratio", "Forfeits"].join(",");
  const rows = sorted.map((e, i) =>
    [
      i + 1,
      `"${e.name.replace(/"/g, '""')}"`,
      e.gamesPlayed,
      e.wins,
      e.losses,
      e.doves,
      e.doveWins,
      e.winRatio.toFixed(3),
      e.forfeits,
    ].join(",")
  );

  const csv = [header, ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mighty-flights-stats.csv"`,
    },
  });
}
