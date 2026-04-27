import { z } from "zod";

export const LngLatSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export const StepConfigSchema = z.object({
  meters: z.number().positive().max(250),
});

export const StreetViewConfigSchema = z.object({
  enabled: z.boolean().default(true),
  radiusMeters: z.number().int().positive().max(100).default(50),
  fov: z.number().int().min(10).max(120).default(90),
  pitch: z.number().int().min(-90).max(90).default(0),
  imageSize: z.object({
    width: z.number().int().min(64).max(2048).default(640),
    height: z.number().int().min(64).max(2048).default(640),
  }),
});

export const SatelliteGridConfigSchema = z.object({
  enabled: z.boolean().default(true),
  columns: z.literal(3).default(3),
  rows: z.literal(2).default(2),
  tileSizePx: z.literal(1080).default(1080),
  oversample: z.number().int().min(1).max(4).default(2),
  paddingMeters: z.number().positive().default(100),
});

export const CreateJobRequestSchema = z.object({
  routeId: z.string().min(1),
  coordinates: z.array(LngLatSchema).min(2),
  step: StepConfigSchema,
  streetView: StreetViewConfigSchema,
  satelliteGrid: SatelliteGridConfigSchema,
  tileProvider: z.enum(["google", "mapbox", "mock"]).default("mock"),
  storageTarget: z.enum(["fs", "s3", "gcs"]).default("fs"),
});

export const JobStatusSchema = z.enum([
  "queued",
  "sampling",
  "streetview_running",
  "satellite_running",
  "finalizing",
  "completed",
  "failed",
]);

export const CreateJobResponseSchema = z.object({
  jobId: z.string(),
  status: JobStatusSchema,
});

export type LngLat = z.infer<typeof LngLatSchema>;
export type StepConfig = z.infer<typeof StepConfigSchema>;
export type StreetViewConfig = z.infer<typeof StreetViewConfigSchema>;
export type SatelliteGridConfig = z.infer<typeof SatelliteGridConfigSchema>;
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type CreateJobResponse = z.infer<typeof CreateJobResponseSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
