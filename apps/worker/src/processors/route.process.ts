import type { Job } from "bullmq";
import type { CreateJobRequest } from "@repo/contracts";
import { densifyRouteByMeters } from "@repo/geo";
import { prisma } from "@repo/db";
import type { StorageDriver } from "@repo/domain";
import { createLogger } from "@repo/observability";

const logger = createLogger("worker:route.process");

interface RouteProcessData {
  jobId: string;
  input: CreateJobRequest;
}

export async function processRoute(
  job: Job<RouteProcessData>,
  storage: StorageDriver,
): Promise<void> {
  const { jobId, input } = job.data;

  logger.info("Starting route processing", { jobId });

  await prisma.pathJob.update({
    where: { id: jobId },
    data: { status: "sampling" },
  });

  const sampledPoints = densifyRouteByMeters(input.coordinates, input.step.meters);

  const manifest = {
    jobId,
    routeId: input.routeId,
    stepMeters: input.step.meters,
    totalPoints: sampledPoints.length,
    sampledPoints,
    createdAt: new Date().toISOString(),
  };

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));

  await storage.putObject({
    key: `jobs/${jobId}/route/sampled-points.json`,
    body: manifestBuffer,
    contentType: "application/json",
  });

  await prisma.jobArtifact.create({
    data: {
      jobId,
      kind: "sampled-points",
      storageKey: `jobs/${jobId}/route/sampled-points.json`,
      contentType: "application/json",
      sizeBytes: manifestBuffer.length,
    },
  });

  logger.info("Route processing complete", { jobId, totalPoints: sampledPoints.length });
}
