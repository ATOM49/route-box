import type { StreetViewProvider, StreetViewMetadata } from "@repo/domain";

export class MockStreetViewProvider implements StreetViewProvider {
  async getMetadata(input: {
    lat: number;
    lng: number;
    radiusMeters: number;
  }): Promise<StreetViewMetadata> {
    return {
      status: "OK",
      panoId: `mock-pano-${input.lat.toFixed(4)}-${input.lng.toFixed(4)}`,
      lat: input.lat,
      lng: input.lng,
      date: "2024-01",
    };
  }

  async getImage(_input: {
    lat: number;
    lng: number;
    heading: number;
    pitch: number;
    fov: number;
    width: number;
    height: number;
  }): Promise<Buffer> {
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
  }
}
