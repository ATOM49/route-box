import type { LngLat } from "@repo/contracts";
import { lngLatToTileXY } from "./mercator.js";

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function computeRouteBBox(coordinates: LngLat[]): BBox {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
}

/** Expand a bounding box by paddingMeters (approximate). */
export function expandBBoxByMeters(bbox: BBox, paddingMeters: number): BBox {
  const latDelta = (paddingMeters / 111320);
  const midLat = (bbox.minLat + bbox.maxLat) / 2;
  const lngDelta = paddingMeters / (111320 * Math.cos((midLat * Math.PI) / 180));
  return {
    minLng: bbox.minLng - lngDelta,
    minLat: bbox.minLat - latDelta,
    maxLng: bbox.maxLng + lngDelta,
    maxLat: bbox.maxLat + latDelta,
  };
}

/** Expand BBox to exact aspect ratio by expanding the shorter dimension. */
export function expandBBoxToAspectRatio(bbox: BBox, aspectRatio: number): BBox {
  const lngRange = bbox.maxLng - bbox.minLng;
  const latRange = bbox.maxLat - bbox.minLat;
  const midLat = (bbox.minLat + bbox.maxLat) / 2;
  const lngPerDeg = 111320 * Math.cos((midLat * Math.PI) / 180);
  const latPerDeg = 111320;

  const widthM = lngRange * lngPerDeg;
  const heightM = latRange * latPerDeg;
  const currentRatio = widthM / heightM;

  if (currentRatio < aspectRatio) {
    const targetWidthM = heightM * aspectRatio;
    const extraLng = (targetWidthM - widthM) / lngPerDeg / 2;
    return { ...bbox, minLng: bbox.minLng - extraLng, maxLng: bbox.maxLng + extraLng };
  } else {
    const targetHeightM = widthM / aspectRatio;
    const extraLat = (targetHeightM - heightM) / latPerDeg / 2;
    return { ...bbox, minLat: bbox.minLat - extraLat, maxLat: bbox.maxLat + extraLat };
  }
}

export interface SatelliteFrame {
  bbox: BBox;
  zoom: number;
  tileMinX: number;
  tileMinY: number;
  tileMaxX: number;
  tileMaxY: number;
  pixelWidth: number;
  pixelHeight: number;
}

const TILE_SIZE = 256;

/**
 * Pick zoom level and tile range to cover the bbox at target resolution.
 */
export function computeSatelliteFrame(
  bbox: BBox,
  targetWidthPx: number,
  targetHeightPx: number,
): SatelliteFrame {
  for (let zoom = 20; zoom >= 1; zoom--) {
    const { x: tileMinX, y: tileMinY } = lngLatToTileXY(bbox.minLng, bbox.maxLat, zoom);
    const { x: tileMaxX, y: tileMaxY } = lngLatToTileXY(bbox.maxLng, bbox.minLat, zoom);

    const tilesWide = tileMaxX - tileMinX + 1;
    const tilesTall = tileMaxY - tileMinY + 1;
    const pixelWidth = tilesWide * TILE_SIZE;
    const pixelHeight = tilesTall * TILE_SIZE;

    if (pixelWidth >= targetWidthPx && pixelHeight >= targetHeightPx) {
      return {
        bbox,
        zoom,
        tileMinX,
        tileMinY,
        tileMaxX,
        tileMaxY,
        pixelWidth,
        pixelHeight,
      };
    }
  }

  const zoom = 1;
  const { x: tileMinX, y: tileMinY } = lngLatToTileXY(bbox.minLng, bbox.maxLat, zoom);
  const { x: tileMaxX, y: tileMaxY } = lngLatToTileXY(bbox.maxLng, bbox.minLat, zoom);
  return {
    bbox,
    zoom,
    tileMinX,
    tileMinY,
    tileMaxX,
    tileMaxY,
    pixelWidth: (tileMaxX - tileMinX + 1) * TILE_SIZE,
    pixelHeight: (tileMaxY - tileMinY + 1) * TILE_SIZE,
  };
}
