import type { Job } from "bullmq";
import type { StreetViewConfig } from "@repo/contracts";
import type { StreetViewProvider, StorageDriver } from "@repo/domain";
import type { SampledPoint } from "@repo/geo";
import { prisma } from "@repo/db";
import { createLogger } from "@repo/observability";

const logger = createLogger("worker:streetview.point");

export interface StreetViewPointData {
  jobId: string;
  point: SampledPoint;
  pointIndex: number;
  config: StreetViewConfig;
}

export async function processStreetViewPoint(
  job: Job<StreetViewPointData>,
  provider: StreetViewProvider,
  storage: StorageDriver,
): Promise<void> {
  const { jobId, point, pointIndex, config } = job.data;

  const indexStr = String(pointIndex + 1).padStart(6, "0");
  logger.debug("Processing street view point", { jobId, pointIndex });

  const metadata = await provider.getMetadata({
    lat: point.lat,
    lng: point.lng,
    radiusMeters: config.radiusMeters,
  });

  const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
  await storage.putObject({
    key: `jobs/${jobId}/streetview/${indexStr}.metadata.json`,
    body: metadataBuffer,
    contentType: "application/json",
  });

  if (metadata.status === "OK") {
    const image = await provider.getImage({
      lat: metadata.lat ?? point.lat,
      lng: metadata.lng ?? point.lng,
      heading: point.heading,
      pitch: config.pitch,
      fov: config.fov,
      width: config.imageSize.width,
      height: config.imageSize.height,
    });

    await storage.putObject({
      key: `jobs/${jobId}/streetview/${indexStr}.jpg`,
      body: image,
      contentType: "image/jpeg",
    });

    await prisma.jobArtifact.create({
      data: {
        jobId,
        kind: "streetview-image",
        storageKey: `jobs/${jobId}/streetview/${indexStr}.jpg`,
        contentType: "image/jpeg",
        sizeBytes: image.length,
        metadataJson: {
          status: metadata.status,
          panoId: metadata.panoId ?? null,
          lat: metadata.lat ?? null,
          lng: metadata.lng ?? null,
          date: metadata.date ?? null,
        },
      },
    });
  }
}
