import type { ApiApplication } from "@api/main";
import { InMemoryObjectStorage } from "@worker/adapters/object-storage";
import { FakePdfRenderer } from "@worker/adapters/pdf-renderer";
import { ExportJobRunner } from "@worker/jobs/export.job";

export const workerName = "magic-resume-export-worker";

export class ExportWorkerApplication {
  private readonly renderer = new FakePdfRenderer();
  private readonly storage = new InMemoryObjectStorage();
  private readonly runner: ExportJobRunner;

  constructor(api: ApiApplication) {
    this.runner = new ExportJobRunner({
      api,
      renderer: this.renderer,
      storage: this.storage
    });
  }

  start(): void {
    this.runner.start();
  }

  stop(): void {
    this.runner.stop();
  }

  getFileByKey(
    key: string
  ): { body: Uint8Array; contentType: string } | null {
    return this.storage.getObject(key);
  }
}
