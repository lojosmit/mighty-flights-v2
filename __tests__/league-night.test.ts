import { describe, it, expect } from "vitest";
import { maxBoards, validBoardCounts, canRunLeagueNight } from "@/lib/league-night-utils";

// Per DESIGN.md Section 4 table — test every player count 6–20.

describe("maxBoards", () => {
  it("< 6 players → 0 (cannot run)", () => {
    expect(maxBoards(5)).toBe(0);
    expect(maxBoards(1)).toBe(0);
  });

  it("6 players → max 2", () => expect(maxBoards(6)).toBe(2));
  it("7 players → max 2", () => expect(maxBoards(7)).toBe(2));
  it("8 players → max 2", () => expect(maxBoards(8)).toBe(2));
  it("9 players → max 2", () => expect(maxBoards(9)).toBe(2));
  it("10 players → max 3", () => expect(maxBoards(10)).toBe(3));
  it("11 players → max 3", () => expect(maxBoards(11)).toBe(3));
  it("12 players → max 3", () => expect(maxBoards(12)).toBe(3));
  it("13 players → max 3", () => expect(maxBoards(13)).toBe(3));
  it("14 players → max 4", () => expect(maxBoards(14)).toBe(4));
  it("15 players → max 4", () => expect(maxBoards(15)).toBe(4));
  it("16 players → max 4", () => expect(maxBoards(16)).toBe(4));
  it("17 players → max 4", () => expect(maxBoards(17)).toBe(4));
  it("18 players → max 5", () => expect(maxBoards(18)).toBe(5));
  it("19 players → max 5", () => expect(maxBoards(19)).toBe(5));
  it("20 players → max 5", () => expect(maxBoards(20)).toBe(5));
});

describe("validBoardCounts", () => {
  it("6 players → [1, 2]", () => expect(validBoardCounts(6)).toEqual([1, 2]));
  it("10 players → [1, 2, 3]", () => expect(validBoardCounts(10)).toEqual([1, 2, 3]));
  it("14 players → [1, 2, 3, 4]", () => expect(validBoardCounts(14)).toEqual([1, 2, 3, 4]));
  it("18 players → [1, 2, 3, 4, 5]", () => expect(validBoardCounts(18)).toEqual([1, 2, 3, 4, 5]));
  it("5 players → [] (empty)", () => expect(validBoardCounts(5)).toEqual([]));
});

describe("canRunLeagueNight", () => {
  it("5 players → false", () => expect(canRunLeagueNight(5)).toBe(false));
  it("6 players → true", () => expect(canRunLeagueNight(6)).toBe(true));
  it("20 players → true", () => expect(canRunLeagueNight(20)).toBe(true));
});
