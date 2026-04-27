import { describe, it, expect } from "vitest";
import { lngLatToTileXY, tileXYToLngLat } from "./mercator.js";

describe("lngLatToTileXY", () => {
  it("converts London at zoom 10 to expected tile", () => {
    const { x, y } = lngLatToTileXY(-0.1278, 51.5074, 10);
    expect(x).toBe(511);
    expect(y).toBe(340);
  });

  it("returns integer tile coordinates", () => {
    const { x, y } = lngLatToTileXY(0, 0, 5);
    expect(Number.isInteger(x)).toBe(true);
    expect(Number.isInteger(y)).toBe(true);
  });
});

describe("tileXYToLngLat", () => {
  it("roundtrips approximately", () => {
    const origLng = 10;
    const origLat = 50;
    const zoom = 12;
    const { x, y } = lngLatToTileXY(origLng, origLat, zoom);
    const { lng, lat } = tileXYToLngLat(x, y, zoom);
    expect(Math.abs(lng - origLng)).toBeLessThan(360 / 2 ** zoom + 1);
    expect(Math.abs(lat - origLat)).toBeLessThan(180 / 2 ** zoom + 10);
  });
});
