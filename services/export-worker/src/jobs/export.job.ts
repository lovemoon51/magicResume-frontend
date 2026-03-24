import type { ApiApplication } from "@api/main";
import type { ResumeExportMessage } from "@magic/types/export";
import type { ObjectStoragePort } from "@worker/adapters/object-storage";
import type { PdfRendererPort } from "@worker/adapters/pdf-renderer";

interface ExportJobRunnerDeps {
  api: ApiApplication;
  renderer: PdfRendererPort;
  storage: ObjectStoragePort;
}

export class ExportJobRunner {
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly deps: ExportJobRunnerDeps) {}

  start(): void {
    if (this.unsubscribe) {
      return;
    }
    this.unsubscribe = this.deps.api.queue.subscribe((message) => {
      void this.handleMessage(message);
    });
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private async handleMessage(message: ResumeExportMessage): Promise<void> {
    const processingMarked = this.deps.api.markExportJobProcessing(message.jobId);
    if (!processingMarked) {
      return;
    }

    const resume = this.deps.api.getResumeSnapshot(message.resumeId);
    if (!resume) {
      this.deps.api.completeExportJob(message.jobId, {
        status: "failed",
        errorCode: "RESUME_NOT_FOUND",
        errorMessage: "resume not found",
        finishedAt: new Date().toISOString(),
        traceId: message.traceId
      });
      return;
    }

    try {
      const bytes = await this.deps.renderer.render(resume, message.templateId);
      const key = `exports/${new Date().toISOString().slice(0, 10)}/${message.jobId}.pdf`;
      const uploadResult = await this.deps.storage.upload({
        key,
        body: bytes,
        contentType: "application/pdf"
      });

      this.deps.api.completeExportJob(message.jobId, {
        status: "succeeded",
        fileKey: uploadResult.fileKey,
        downloadUrl: uploadResult.downloadUrl,
        finishedAt: new Date().toISOString(),
        traceId: message.traceId
      });
    } catch (error) {
      this.deps.api.completeExportJob(message.jobId, {
        status: "failed",
        errorCode: "PDF_RENDER_ERROR",
        errorMessage: error instanceof Error ? error.message : "render failed",
        finishedAt: new Date().toISOString(),
        traceId: message.traceId
      });
    }
  }
}
