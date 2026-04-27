import { z } from "zod";

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  STORAGE_DRIVER: z.enum(["fs", "s3", "gcs"]).default("fs"),
  FS_STORAGE_ROOT: z.string().default(".local/storage"),
  TILE_PROVIDER: z.enum(["google", "mapbox", "mock"]).default("mock"),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  DEFAULT_STEP_METERS: z.coerce.number().int().positive().default(10),
  STREETVIEW_RADIUS_METERS: z.coerce.number().int().positive().default(50),
  GRID_COLUMNS: z.coerce.number().int().positive().default(3),
  GRID_ROWS: z.coerce.number().int().positive().default(2),
  INSTAGRAM_TILE_SIZE: z.coerce.number().int().positive().default(1080),
  MOSAIC_OVERSAMPLE: z.coerce.number().int().min(1).max(4).default(2),
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(8),
  CHILD_JOB_CONCURRENCY: z.coerce.number().int().positive().default(16),
});

const ApiEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3001),
});

const WorkerEnvSchema = BaseEnvSchema;

export function parseBaseEnv(raw: NodeJS.ProcessEnv = process.env) {
  return BaseEnvSchema.parse(raw);
}

export function parseApiEnv(raw: NodeJS.ProcessEnv = process.env) {
  return ApiEnvSchema.parse(raw);
}

export function parseWorkerEnv(raw: NodeJS.ProcessEnv = process.env) {
  return WorkerEnvSchema.parse(raw);
}

export type BaseEnv = z.infer<typeof BaseEnvSchema>;
export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
