import { describe, it, expect } from "vitest";
import { CreateJobRequestSchema, JobStatusSchema } from "./job.js";

describe("CreateJobRequestSchema", () => {
  it("parses valid input", () => {
    const input = {
      routeId: "route-1",
      coordinates: [
        [-0.1278, 51.5074],
        [-0.1276, 51.5075],
      ],
      step: { meters: 10 },
      streetView: {
        enabled: true,
        radiusMeters: 50,
        fov: 90,
        pitch: 0,
        imageSize: { width: 640, height: 640 },
      },
      satelliteGrid: {
        enabled: true,
        columns: 3,
        rows: 2,
        tileSizePx: 1080,
        oversample: 2,
        paddingMeters: 100,
      },
    };
    const result = CreateJobRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid coordinates", () => {
    const input = {
      routeId: "route-1",
      coordinates: [[-200, 51]],
      step: { meters: 10 },
      streetView: { enabled: true, radiusMeters: 50, fov: 90, pitch: 0, imageSize: { width: 640, height: 640 } },
      satelliteGrid: { enabled: true, columns: 3, rows: 2, tileSizePx: 1080, oversample: 2, paddingMeters: 100 },
    };
    const result = CreateJobRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("requires at least 2 coordinates", () => {
    const input = {
      routeId: "route-1",
      coordinates: [[-0.1278, 51.5074]],
      step: { meters: 10 },
      streetView: { enabled: true, radiusMeters: 50, fov: 90, pitch: 0, imageSize: { width: 640, height: 640 } },
      satelliteGrid: { enabled: true, columns: 3, rows: 2, tileSizePx: 1080, oversample: 2, paddingMeters: 100 },
    };
    const result = CreateJobRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("JobStatusSchema", () => {
  it("accepts valid statuses", () => {
    const statuses = ["queued", "sampling", "streetview_running", "satellite_running", "finalizing", "completed", "failed"];
    for (const s of statuses) {
      expect(JobStatusSchema.safeParse(s).success).toBe(true);
    }
  });
});
