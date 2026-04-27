export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface StoredObject {
  key: string;
  etag?: string;
  sizeBytes: number;
}

export interface StorageDriver {
  putObject(input: PutObjectInput): Promise<StoredObject>;
  getObject(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  publicUrl?(key: string): string;
}
