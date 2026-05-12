import { describe, it, expect, beforeAll } from "vitest";
import { computeMultiplier, getHandicapTable, getMultiplier, updateMultiplier } from "@/lib/handicap";

// Seed the table before any DB tests run.
beforeAll(async () => {
  await getHandicapTable();
});

describe("computeMultiplier (pure function)", () => {
  it("rank 1 = 1.0", () => expect(computeMultiplier(1)).toBe(1.0));
  it("rank 2 = 1.0", () => expect(computeMultiplier(2)).toBe(1.0));
  it("rank 3 = 1.1", () => expect(computeMultiplier(3)).toBe(1.1));
  it("rank 5 = 1.2", () => expect(computeMultiplier(5)).toBe(1.2));
  it("rank 7 = 1.3", () => expect(computeMultiplier(7)).toBe(1.3));
  it("rank 9 = 1.4", () => expect(computeMultiplier(9)).toBe(1.4));
  it("rank 11 = 1.5", () => expect(computeMultiplier(11)).toBe(1.5));
  it("rank 13 = 1.6", () => expect(computeMultiplier(13)).toBe(1.6));
});

describe("getMultiplier (DB-backed)", () => {
  it("rank 1 = 1.0", async () => expect(await getMultiplier(1)).toBe(1.0));
  it("rank 5 = 1.2", async () => expect(await getMultiplier(5)).toBe(1.2));
  it("rank 13 = 1.6", async () => expect(await getMultiplier(13)).toBe(1.6));
  it("rank beyond table falls back to formula", async () => {
    expect(await getMultiplier(25)).toBe(computeMultiplier(25));
  });
});

describe("updateMultiplier (custom edits persist)", () => {
  it("updates a row and reads back the new value", async () => {
    const table = await getHandicapTable();
    const row = table.find((r) => r.rankFrom === 3)!;
    const original = parseFloat(row.multiplier);

    await updateMultiplier(row.id, 1.25);
    expect(await getMultiplier(3)).toBe(1.25);

    // Restore original value
    await updateMultiplier(row.id, original);
    expect(await getMultiplier(3)).toBe(original);
  });
});
