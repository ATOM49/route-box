import type { StorageDriver } from "@repo/domain";
import { FsStorageDriver } from "./fs.js";

export function createStorageDriver(
  driver: "fs" | "s3" | "gcs",
  config: { root?: string },
): StorageDriver {
  switch (driver) {
    case "fs":
      return new FsStorageDriver(config.root ?? ".local/storage");
    case "s3":
      throw new Error("S3 storage driver not yet implemented");
    case "gcs":
      throw new Error("GCS storage driver not yet implemented");
    default: {
      const _exhaustive: never = driver;
      throw new Error(`Unknown storage driver: ${String(_exhaustive)}`);
    }
  }
}
