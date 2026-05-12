import { create } from "zustand";

export const GRID_ROWS = [
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "Double", "Triple", "Bull",
] as const;
export type GridRow = (typeof GRID_ROWS)[number];

export type FixtureResult =
  | "in_progress"
  | "teamA_win"
  | "teamB_win"
  | "special_win_A"
  | "special_win_B"
  | "double_forfeit";

export interface TeamState {
  name: string;
  score: number;           // raw score entered by host
  handicap: number;        // multiplier, e.g. 1.2
  specialWin: boolean;     // +1 flat bonus point
  crosses: Record<GridRow, 0 | 1 | 2 | 3>;
}

interface ScorekeeperStore {
  teamA: TeamState;
  teamB: TeamState;
  durationMinutes: number; // 5–20
  timeRemaining: number;   // seconds
  timerRunning: boolean;
  result: FixtureResult;

  // Team actions
  setTeamName: (team: "A" | "B", name: string) => void;
  setScore: (team: "A" | "B", score: number) => void;
  setHandicap: (team: "A" | "B", value: number) => void;
  toggleSpecialWin: (team: "A" | "B") => void;
  cycleCross: (team: "A" | "B", row: GridRow) => void;

  // Timer actions
  setDuration: (minutes: number) => void;
  tick: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  // Result
  setResult: (result: FixtureResult) => void;
  reset: () => void;
}

const emptyCrosses = (): Record<GridRow, 0 | 1 | 2 | 3> =>
  Object.fromEntries(GRID_ROWS.map((r) => [r, 0])) as Record<GridRow, 0 | 1 | 2 | 3>;

const DEFAULT_DURATION = 10;

const initialTeam = (name: string): TeamState => ({
  name,
  score: 0,
  handicap: 1.0,
  specialWin: false,
  crosses: emptyCrosses(),
});

export function finalScore(team: TeamState): number {
  return parseFloat((team.score * team.handicap + (team.specialWin ? 1 : 0)).toFixed(2));
}

export const useScorekeeperStore = create<ScorekeeperStore>((set) => ({
  teamA: initialTeam("Team A"),
  teamB: initialTeam("Team B"),
  durationMinutes: DEFAULT_DURATION,
  timeRemaining: DEFAULT_DURATION * 60,
  timerRunning: false,
  result: "in_progress",

  setTeamName: (team, name) =>
    set((s) => ({
      [team === "A" ? "teamA" : "teamB"]: {
        ...(team === "A" ? s.teamA : s.teamB),
        name,
      },
    })),

  setScore: (team, score) =>
    set((s) => ({
      [team === "A" ? "teamA" : "teamB"]: {
        ...(team === "A" ? s.teamA : s.teamB),
        score,
      },
    })),

  setHandicap: (team, value) =>
    set((s) => ({
      [team === "A" ? "teamA" : "teamB"]: {
        ...(team === "A" ? s.teamA : s.teamB),
        handicap: value,
      },
    })),

  toggleSpecialWin: (team) =>
    set((s) => {
      const t = team === "A" ? s.teamA : s.teamB;
      return {
        [team === "A" ? "teamA" : "teamB"]: { ...t, specialWin: !t.specialWin },
      };
    }),

  cycleCross: (team, row) =>
    set((s) => {
      const t = team === "A" ? s.teamA : s.teamB;
      const current = t.crosses[row];
      const next = ((current + 1) % 4) as 0 | 1 | 2 | 3;
      return {
        [team === "A" ? "teamA" : "teamB"]: {
          ...t,
          crosses: { ...t.crosses, [row]: next },
        },
      };
    }),

  setDuration: (minutes) =>
    set({ durationMinutes: minutes, timeRemaining: minutes * 60, timerRunning: false }),

  tick: () =>
    set((s) => {
      if (s.timeRemaining <= 0) return { timerRunning: false };
      return { timeRemaining: s.timeRemaining - 1 };
    }),

  startTimer: () => set({ timerRunning: true }),
  pauseTimer: () => set({ timerRunning: false }),
  resetTimer: () =>
    set((s) => ({ timeRemaining: s.durationMinutes * 60, timerRunning: false })),

  setResult: (result) => set({ result }),

  reset: () =>
    set({
      teamA: initialTeam("Team A"),
      teamB: initialTeam("Team B"),
      durationMinutes: DEFAULT_DURATION,
      timeRemaining: DEFAULT_DURATION * 60,
      timerRunning: false,
      result: "in_progress",
    }),
}));
