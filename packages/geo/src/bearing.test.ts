import { describe, it, expect } from "vitest";
import { computeBearing } from "./bearing.js";

describe("computeBearing", () => {
  it("computes north bearing", () => {
    const b = computeBearing(0, 0, 1, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it("computes east bearing", () => {
    const b = computeBearing(0, 0, 0, 1);
    expect(b).toBeCloseTo(90, 0);
  });

  it("returns value in [0, 360)", () => {
    for (let i = 0; i < 10; i++) {
      const b = computeBearing(
        Math.random() * 180 - 90,
        Math.random() * 360 - 180,
        Math.random() * 180 - 90,
        Math.random() * 360 - 180,
      );
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });
});
