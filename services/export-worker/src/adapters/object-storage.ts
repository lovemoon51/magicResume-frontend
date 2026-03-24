export interface UploadInput {
  key: string;
  contentType: string;
  body: Uint8Array;
}

export interface UploadResult {
  fileKey: string;
  downloadUrl: string;
  etag: string;
}

export interface StoredObject {
  body: Uint8Array;
  contentType: string;
}

export interface ObjectStoragePort {
  upload(input: UploadInput): Promise<UploadResult>;
}

export class InMemoryObjectStorage implements ObjectStoragePort {
  private readonly files = new Map<string, StoredObject>();

  async upload(input: UploadInput): Promise<UploadResult> {
    this.files.set(input.key, {
      body: input.body,
      contentType: input.contentType
    });
    return {
      fileKey: input.key,
      downloadUrl: `/downloads/${encodeURIComponent(input.key)}`,
      etag: `etag_${input.key}`
    };
  }

  getObject(key: string): StoredObject | null {
    return this.files.get(key) ?? null;
  }
}
