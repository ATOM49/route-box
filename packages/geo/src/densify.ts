import type { LngLat } from "@repo/contracts";

/** Haversine distance between two points in meters. */
function haversineMeters(a: LngLat, b: LngLat): number {
  const R = 6371000;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const hav = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(hav));
}

/** Interpolate between two lng/lat points at fraction t [0,1]. */
function interpolate(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export interface SampledPoint {
  lng: number;
  lat: number;
  /** Forward-direction heading in degrees [0, 360) */
  heading: number;
  /** Distance along the route from the start in meters */
  distanceMeters: number;
}

/**
 * Densify a route by sampling one point every stepMeters.
 * The first and last coordinates of the input are always included.
 */
export function densifyRouteByMeters(
  coordinates: LngLat[],
  stepMeters: number,
): SampledPoint[] {
  if (coordinates.length < 2) return [];

  const points: SampledPoint[] = [];
  let accumulated = 0;
  let lastEmittedDistance = 0;

  // Emit the first point
  const first = coordinates[0]!;
  const second = coordinates[1]!;
  const firstHeading = computeBearingFromPair(first, second);
  points.push({ lng: first[0], lat: first[1], heading: firstHeading, distanceMeters: 0 });

  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = coordinates[i]!;
    const b = coordinates[i + 1]!;
    const segDist = haversineMeters(a, b);

    let offset = stepMeters - (accumulated - lastEmittedDistance);
    while (offset <= segDist) {
      const t = offset / segDist;
      const pt = interpolate(a, b, t);
      const heading = computeBearingFromPair(a, b);
      const dist = accumulated + offset;
      points.push({ lng: pt[0], lat: pt[1], heading, distanceMeters: dist });
      lastEmittedDistance = dist;
      offset += stepMeters;
    }

    accumulated += segDist;
  }

  // Always include the last point if not already very close
  const last = coordinates[coordinates.length - 1]!;
  const prevLast = coordinates[coordinates.length - 2]!;
  const lastHeading = computeBearingFromPair(prevLast, last);
  const totalDist = accumulated;
  const lastPt = points[points.length - 1];
  if (
    lastPt === undefined ||
    Math.abs(lastPt.distanceMeters - totalDist) > 1
  ) {
    points.push({ lng: last[0], lat: last[1], heading: lastHeading, distanceMeters: totalDist });
  }

  return points;
}

function computeBearingFromPair(a: LngLat, b: LngLat): number {
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
