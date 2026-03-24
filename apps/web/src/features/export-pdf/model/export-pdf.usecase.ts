import type { ResumeRepository } from "@web/entities/resume/api";
import type { ResumeEditorStore } from "@web/features/resume-editor/model/resume-editor.store";

interface ExportPdfUseCaseDeps {
  repository: ResumeRepository;
  store: ResumeEditorStore;
  sleepMs?: number;
}

export class ExportPdfUseCase {
  private readonly sleepMs: number;

  constructor(private readonly deps: ExportPdfUseCaseDeps) {
    this.sleepMs = deps.sleepMs ?? 1200;
  }

  async start(resumeId: string, templateId: string): Promise<string> {
    const state = this.deps.store.getState();
    if (!state.resume) {
      throw new Error("resume not loaded");
    }

    const job = await this.deps.repository.createExportJob(resumeId, {
      templateId,
      snapshotVersion: state.resume.version,
      format: "pdf"
    });

    this.deps.store.setState({
      exportState: {
        jobId: job.jobId,
        status: job.status,
        downloadUrl: "",
        errorCode: "",
        errorMessage: ""
      }
    });

    return job.jobId;
  }

  async waitUntilDone(jobId: string, maxAttempts = 30): Promise<void> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const job = await this.deps.repository.getExportJob(jobId);
      this.deps.store.setState({
        exportState: {
          jobId,
          status: job.status,
          downloadUrl: job.downloadUrl,
          errorCode: job.errorCode,
          errorMessage: job.errorMessage
        }
      });

      if (job.status === "succeeded" || job.status === "failed") {
        return;
      }
      attempts += 1;
      await this.sleep(this.sleepMs);
    }

    this.deps.store.setState({
      exportState: {
        jobId,
        status: "failed",
        downloadUrl: "",
        errorCode: "EXPORT_JOB_TIMEOUT",
        errorMessage: "export polling timeout"
      }
    });
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
