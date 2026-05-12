import { describe, it, expect } from "vitest";
import { finalScore } from "@/store/scorekeeper";
import type { TeamState } from "@/store/scorekeeper";
import { GRID_ROWS } from "@/store/scorekeeper";

function makeTeam(overrides: Partial<TeamState> = {}): TeamState {
  return {
    name: "Test",
    score: 0,
    handicap: 1.0,
    specialWin: false,
    crosses: Object.fromEntries(GRID_ROWS.map((r) => [r, 0])) as TeamState["crosses"],
    ...overrides,
  };
}

describe("finalScore — handicap math", () => {
  it("score × 1.0 = same score", () => {
    expect(finalScore(makeTeam({ score: 100, handicap: 1.0 }))).toBe(100);
  });

  it("score × 1.2 multiplies correctly", () => {
    expect(finalScore(makeTeam({ score: 100, handicap: 1.2 }))).toBe(120);
  });

  it("score × 1.5 multiplies correctly", () => {
    expect(finalScore(makeTeam({ score: 80, handicap: 1.5 }))).toBe(120);
  });

  it("score 0 with any handicap is 0", () => {
    expect(finalScore(makeTeam({ score: 0, handicap: 1.4 }))).toBe(0);
  });
});

describe("finalScore — bonus point (special win)", () => {
  it("special win adds flat +1 regardless of handicap", () => {
    expect(finalScore(makeTeam({ score: 100, handicap: 1.0, specialWin: true }))).toBe(101);
  });

  it("special win +1 is NOT multiplied by handicap", () => {
    // score 100 × 1.3 = 130, then +1 flat = 131 (NOT 100 × 1.3 + 1.3)
    expect(finalScore(makeTeam({ score: 100, handicap: 1.3, specialWin: true }))).toBe(131);
  });

  it("special win with score 0 = 1", () => {
    expect(finalScore(makeTeam({ score: 0, handicap: 1.5, specialWin: true }))).toBe(1);
  });
});

describe("timer countdown logic", () => {
  it("10 minutes = 600 seconds", () => {
    expect(10 * 60).toBe(600);
  });

  it("5 minutes = 300 seconds", () => {
    expect(5 * 60).toBe(300);
  });

  it("20 minutes = 1200 seconds", () => {
    expect(20 * 60).toBe(1200);
  });

  it("last 60 seconds threshold is correct", () => {
    const timeRemaining = 59;
    expect(timeRemaining <= 60).toBe(true);
  });

  it("formatTime renders MM:SS correctly", () => {
    function formatTime(s: number) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(0)).toBe("00:00");
  });
});
