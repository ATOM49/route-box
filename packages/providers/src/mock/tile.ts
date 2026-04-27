import type { TileProvider } from "@repo/domain";

export class MockTileProvider implements TileProvider {
  readonly name = "mock" as const;

  async getTile(_input: {
    z: number;
    x: number;
    y: number;
    style: "satellite";
    scale?: 1 | 2;
  }): Promise<Buffer> {
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
  }
}
