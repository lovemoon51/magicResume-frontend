import type {
  CompleteExportJobRequestDto,
  CreateExportJobRequestDto,
  CreateExportJobResponseDto,
  ExportQueueMessageDto,
  GetExportJobResponseDto
} from "./export.dto";
import type { ExportStatus } from "@magic/types/export";
import type { ResumeService } from "@api/modules/resume/resume.service";
import type { QueuePublishResult, ResumeExportQueue } from "./export.queue";

interface ExportJobEntity {
  jobId: string;
  resumeId: string;
  snapshotVersion: number;
  templateId: string;
  status: ExportStatus;
  downloadUrl: string;
  errorCode: string;
  errorMessage: string;
  dedupeKey: string;
}

export class ExportService {
  private readonly jobs = new Map<string, ExportJobEntity>();
  private readonly dedupeIndex = new Map<string, string>();

  constructor(
    private readonly queue: ResumeExportQueue,
    private readonly resumeService: ResumeService
  ) {}

  createExportJob(
    resumeId: string,
    request: CreateExportJobRequestDto,
    traceId: string
  ): { result: CreateExportJobResponseDto; queue: QueuePublishResult } | null {
    const resume = this.resumeService.getResume(resumeId);
    if (!resume) {
      return null;
    }

    const dedupeKey = `${resumeId}:${request.snapshotVersion}:${request.format}`;
    const existingJobId = this.dedupeIndex.get(dedupeKey);
    if (existingJobId) {
      const existing = this.jobs.get(existingJobId);
      if (existing) {
        return {
          result: {
            jobId: existing.jobId,
            status: existing.status
          },
          queue: {
            queued: true,
            queueMsgId: `msg_${existing.jobId}`
          }
        };
      }
    }

    const jobId = createJobId();
    const entity: ExportJobEntity = {
      jobId,
      resumeId,
      snapshotVersion: request.snapshotVersion,
      templateId: request.templateId,
      status: "queued",
      downloadUrl: "",
      errorCode: "",
      errorMessage: "",
      dedupeKey
    };

    this.jobs.set(jobId, entity);
    this.dedupeIndex.set(dedupeKey, jobId);

    const message: ExportQueueMessageDto = {
      jobId,
      resumeId,
      snapshotVersion: request.snapshotVersion,
      templateId: request.templateId,
      requestedBy: resume.userId,
      traceId,
      createdAt: new Date().toISOString()
    };
    const queueResult = this.queue.publish(message);

    return {
      result: {
        jobId,
        status: "queued"
      },
      queue: queueResult
    };
  }

  getExportJob(jobId: string): GetExportJobResponseDto | null {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }
    return {
      jobId: job.jobId,
      status: job.status,
      downloadUrl: job.downloadUrl,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage
    };
  }

  setProcessing(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }
    if (job.status !== "queued") {
      return false;
    }
    job.status = "processing";
    return true;
  }

  completeExportJob(
    jobId: string,
    request: CompleteExportJobRequestDto
  ): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }
    if (job.status === "succeeded" || job.status === "failed") {
      return false;
    }

    job.status = request.status;
    job.downloadUrl = request.downloadUrl ?? "";
    job.errorCode = request.errorCode ?? "";
    job.errorMessage = request.errorMessage ?? "";
    return true;
  }
}

function createJobId(): string {
  return `job_${Math.random().toString(36).slice(2, 14)}`;
}
