import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { parseWorkerEnv } from "@repo/config";
import { createStorageDriver } from "@repo/storage";
import { MockTileProvider, MockStreetViewProvider } from "@repo/providers";
import { createLogger } from "@repo/observability";
import { processRoute } from "./processors/route.process.js";
import { processStreetViewPoint } from "./processors/streetview.point.js";
import { processSatelliteGrid } from "./processors/satellite.grid.js";
import { finalizeJob } from "./processors/job.finalize.js";

const env = parseWorkerEnv();
const logger = createLogger("worker", env.LOG_LEVEL);

const storage = createStorageDriver(env.STORAGE_DRIVER, { root: env.FS_STORAGE_ROOT });
const tileProvider = new MockTileProvider();
const streetViewProvider = new MockStreetViewProvider();

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  "route-pipeline",
  async (job) => {
    switch (job.name) {
      case "route.process":
        await processRoute(job as Parameters<typeof processRoute>[0], storage);
        break;
      case "streetview.point":
        await processStreetViewPoint(
          job as Parameters<typeof processStreetViewPoint>[0],
          streetViewProvider,
          storage,
        );
        break;
      case "satellite.grid":
        await processSatelliteGrid(
          job as Parameters<typeof processSatelliteGrid>[0],
          tileProvider,
          storage,
        );
        break;
      case "job.finalize":
        await finalizeJob(job as Parameters<typeof finalizeJob>[0]);
        break;
      default:
        logger.warn(`Unknown job type: ${job.name}`);
    }
  },
  { connection, concurrency: env.JOB_CONCURRENCY },
);

worker.on("completed", (job) => logger.info(`Job ${job.id} completed`));
worker.on("failed", (job, err) => logger.error(`Job ${job?.id} failed`, err));

logger.info("Worker started");
