export interface TileProvider {
  readonly name: "google" | "mapbox" | "mock";

  getTile(input: {
    z: number;
    x: number;
    y: number;
    style: "satellite";
    scale?: 1 | 2;
  }): Promise<Buffer>;
}

export interface StreetViewMetadata {
  status: "OK" | "ZERO_RESULTS" | "ERROR";
  panoId?: string;
  lat?: number;
  lng?: number;
  date?: string;
}

export interface StreetViewProvider {
  getMetadata(input: {
    lat: number;
    lng: number;
    radiusMeters: number;
  }): Promise<StreetViewMetadata>;

  getImage(input: {
    lat: number;
    lng: number;
    heading: number;
    pitch: number;
    fov: number;
    width: number;
    height: number;
  }): Promise<Buffer>;
}
