import type { Job } from "bullmq";
import type { CreateJobRequest } from "@repo/contracts";
import {
  computeRouteBBox,
  expandBBoxByMeters,
  expandBBoxToAspectRatio,
  computeSatelliteFrame,
  computeInstagramCropBoxes,
  INSTAGRAM_GRID,
} from "@repo/geo";
import type { TileProvider, StorageDriver } from "@repo/domain";
import { prisma } from "@repo/db";
import { createLogger } from "@repo/observability";
import sharp from "sharp";

const logger = createLogger("worker:satellite.grid");

export interface SatelliteGridData {
  jobId: string;
  input: CreateJobRequest;
}

export async function processSatelliteGrid(
  job: Job<SatelliteGridData>,
  tileProvider: TileProvider,
  storage: StorageDriver,
): Promise<void> {
  const { jobId, input } = job.data;
  const { satelliteGrid } = input;

  logger.info("Starting satellite grid generation", { jobId });

  await prisma.pathJob.update({
    where: { id: jobId },
    data: { status: "satellite_running" },
  });

  const rawBBox = computeRouteBBox(input.coordinates);
  const paddedBBox = expandBBoxByMeters(rawBBox, satelliteGrid.paddingMeters);
  const frameBBox = expandBBoxToAspectRatio(paddedBBox, INSTAGRAM_GRID.aspectRatio);

  const targetW = INSTAGRAM_GRID.compositeWidthPx * satelliteGrid.oversample;
  const targetH = INSTAGRAM_GRID.compositeHeightPx * satelliteGrid.oversample;

  const frame = computeSatelliteFrame(frameBBox, targetW, targetH);

  logger.info("Satellite frame computed", {
    zoom: frame.zoom,
    tiles: `${frame.tileMaxX - frame.tileMinX + 1}x${frame.tileMaxY - frame.tileMinY + 1}`,
  });

  const tilesWide = frame.tileMaxX - frame.tileMinX + 1;
  const tilesTall = frame.tileMaxY - frame.tileMinY + 1;
  const TILE_SIZE = 256;

  const mosaicWidth = tilesWide * TILE_SIZE;
  const mosaicHeight = tilesTall * TILE_SIZE;

  const composites: sharp.OverlayOptions[] = [];

  for (let ty = frame.tileMinY; ty <= frame.tileMaxY; ty++) {
    for (let tx = frame.tileMinX; tx <= frame.tileMaxX; tx++) {
      const tileBuffer = await tileProvider.getTile({
        z: frame.zoom,
        x: tx,
        y: ty,
        style: "satellite",
        scale: 1,
      });

      const resizedTile = await sharp(tileBuffer)
        .resize(TILE_SIZE, TILE_SIZE, { fit: "fill" })
        .png()
        .toBuffer();

      composites.push({
        input: resizedTile,
        left: (tx - frame.tileMinX) * TILE_SIZE,
        top: (ty - frame.tileMinY) * TILE_SIZE,
      });
    }
  }

  const mosaicBuffer = await sharp({
    create: { width: mosaicWidth, height: mosaicHeight, channels: 3, background: "#000000" },
  })
    .composite(composites)
    .png()
    .toBuffer();

  const compositeBuffer = await sharp(mosaicBuffer)
    .resize(INSTAGRAM_GRID.compositeWidthPx, INSTAGRAM_GRID.compositeHeightPx, { fit: "fill" })
    .png()
    .toBuffer();

  await storage.putObject({
    key: `jobs/${jobId}/satellite/mosaic/full.png`,
    body: compositeBuffer,
    contentType: "image/png",
  });

  await prisma.jobArtifact.create({
    data: {
      jobId,
      kind: "satellite-mosaic",
      storageKey: `jobs/${jobId}/satellite/mosaic/full.png`,
      contentType: "image/png",
      sizeBytes: compositeBuffer.length,
    },
  });

  const cropBoxes = computeInstagramCropBoxes();
  const gridManifest: unknown[] = [];

  for (const box of cropBoxes) {
    const tileBuffer = await sharp(compositeBuffer)
      .extract({
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
      })
      .jpeg({ quality: 95 })
      .toBuffer();

    const tileKey = `jobs/${jobId}/satellite/instagram/r${box.row}-c${box.col}.jpg`;

    await storage.putObject({
      key: tileKey,
      body: tileBuffer,
      contentType: "image/jpeg",
    });

    await prisma.jobArtifact.create({
      data: {
        jobId,
        kind: "instagram-tile",
        storageKey: tileKey,
        contentType: "image/jpeg",
        sizeBytes: tileBuffer.length,
        metadataJson: { row: box.row, col: box.col, uploadOrder: box.uploadOrder },
      },
    });

    gridManifest.push({
      key: tileKey,
      row: box.row,
      col: box.col,
      uploadOrder: box.uploadOrder,
    });
  }

  const manifestBuffer = Buffer.from(JSON.stringify({
    jobId,
    provider: tileProvider.name,
    attribution: `Map data © ${tileProvider.name}`,
    compositeSize: { width: INSTAGRAM_GRID.compositeWidthPx, height: INSTAGRAM_GRID.compositeHeightPx },
    grid: { columns: INSTAGRAM_GRID.columns, rows: INSTAGRAM_GRID.rows, tileSizePx: INSTAGRAM_GRID.tileSizePx },
    tiles: gridManifest,
    createdAt: new Date().toISOString(),
  }, null, 2));

  await storage.putObject({
    key: `jobs/${jobId}/satellite/instagram/manifest.json`,
    body: manifestBuffer,
    contentType: "application/json",
  });

  logger.info("Satellite grid generation complete", { jobId });
}
