import { describe, it, expect } from "vitest";
import { computeInstagramCropBoxes, INSTAGRAM_GRID } from "./instagram.js";

describe("computeInstagramCropBoxes", () => {
  it("returns exactly 6 crop boxes", () => {
    const boxes = computeInstagramCropBoxes();
    expect(boxes).toHaveLength(6);
  });

  it("each box is 1080x1080", () => {
    for (const box of computeInstagramCropBoxes()) {
      expect(box.width).toBe(INSTAGRAM_GRID.tileSizePx);
      expect(box.height).toBe(INSTAGRAM_GRID.tileSizePx);
    }
  });

  it("boxes cover full 3240x2160 with no gaps", () => {
    const boxes = computeInstagramCropBoxes();
    expect(boxes.some((b) => b.x === 0 && b.y === 0)).toBe(true);
    expect(boxes.some((b) => b.x === 2160 && b.y === 1080)).toBe(true);
  });

  it("upload order starts at 1 and ends at 6", () => {
    const orders = computeInstagramCropBoxes().map((b) => b.uploadOrder).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("first upload is r1-c2 (bottom-right)", () => {
    const boxes = computeInstagramCropBoxes();
    const first = boxes.find((b) => b.uploadOrder === 1);
    expect(first?.row).toBe(1);
    expect(first?.col).toBe(2);
  });
});
