// Server-side prediction data fetcher — not a "use server" action, just a helper.

import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "./db/index";
import { players, pairStats as pairStatsTable } from "./db/schema";
import type { Fixture } from "./db/schema";
import { computeWinProbability, type WinProbability } from "./prediction-utils";

export type FixturePrediction = WinProbability | null;

export async function getFixturePredictions(
  fixtures: Fixture[]
): Promise<Record<string, FixturePrediction>> {
  const pending = fixtures.filter((f) => f.result === "in_progress");
  if (pending.length === 0) return {};

  const allPlayerIds = [
    ...new Set(
      pending.flatMap((f) => [...f.teamA.playerIds, ...f.teamB.playerIds])
    ),
  ];

  const playerRows = await db
    .select({ id: players.id, wins: players.wins, losses: players.losses })
    .from(players)
    .where(inArray(players.id, allPlayerIds));

  const playerStatsMap = new Map(
    playerRows.map((p) => [p.id, { wins: p.wins, gamesPlayed: p.wins + p.losses }])
  );

  // Unique sorted pairs from 2-player teams
  const sortedPairs = [
    ...new Map(
      pending
        .flatMap((f) => [f.teamA.playerIds, f.teamB.playerIds])
        .filter((ids) => ids.length === 2)
        .map((ids) => [...ids].sort() as [string, string])
        .map((pair) => [pair.join(":"), pair] as [string, [string, string]])
    ).values(),
  ];

  const pairRows =
    sortedPairs.length > 0
      ? await db
          .select()
          .from(pairStatsTable)
          .where(
            or(
              ...sortedPairs.map(([a, b]) =>
                and(
                  eq(pairStatsTable.playerIdA, a),
                  eq(pairStatsTable.playerIdB, b)
                )
              )
            )
          )
      : [];

  const pairStatsMap = new Map(
    pairRows.map((r) => [
      `${r.playerIdA}:${r.playerIdB}`,
      { wins: r.wins, gamesPlayed: r.gamesPlayed },
    ])
  );

  const result: Record<string, FixturePrediction> = {};
  for (const fixture of pending) {
    const teamAPlayers = fixture.teamA.playerIds.map(
      (id) => playerStatsMap.get(id) ?? { wins: 0, gamesPlayed: 0 }
    );
    const teamBPlayers = fixture.teamB.playerIds.map(
      (id) => playerStatsMap.get(id) ?? { wins: 0, gamesPlayed: 0 }
    );

    const getPair = (ids: string[]) => {
      if (ids.length !== 2) return null;
      const key = [...ids].sort().join(":");
      return pairStatsMap.get(key) ?? null;
    };

    result[fixture.id] = computeWinProbability(
      { players: teamAPlayers, pairStats: getPair(fixture.teamA.playerIds) },
      { players: teamBPlayers, pairStats: getPair(fixture.teamB.playerIds) }
    );
  }

  return result;
}
