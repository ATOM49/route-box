import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { StorageDriver, PutObjectInput, StoredObject } from "@repo/domain";

export class FsStorageDriver implements StorageDriver {
  constructor(private readonly root: string) {}

  private resolvePath(key: string): string {
    return join(this.root, key);
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const filePath = this.resolvePath(input.key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body);
    return { key: input.key, sizeBytes: input.body.length };
  }

  async getObject(key: string): Promise<Buffer> {
    const filePath = this.resolvePath(key);
    return readFile(filePath);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  publicUrl(key: string): string {
    return `file://${this.resolvePath(key)}`;
  }
}
