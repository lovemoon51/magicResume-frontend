import type { ApiError, ApiResponse } from "@magic/types/common";
import type {
  CompleteExportJobRequestDto,
  CompleteExportJobResponseDto,
  CreateExportJobRequestDto,
  CreateExportJobResponseDto,
  GetExportJobResponseDto
} from "./export.dto";
import { createTraceId, fail, ok } from "@api/common/response";
import { ExportService } from "./export.service";

export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  createExportJob(
    resumeId: string,
    body: CreateExportJobRequestDto
  ): ApiResponse<CreateExportJobResponseDto> | ApiError {
    const traceId = createTraceId();
    const job = this.exportService.createExportJob(resumeId, body, traceId);
    if (!job) {
      return fail(traceId, "RESUME_NOT_FOUND", "resume not found");
    }
    return ok(traceId, job.result, "accepted");
  }

  getExportJob(jobId: string): ApiResponse<GetExportJobResponseDto> | ApiError {
    const traceId = createTraceId();
    const job = this.exportService.getExportJob(jobId);
    if (!job) {
      return fail(traceId, "EXPORT_JOB_NOT_FOUND", "export job not found");
    }
    return ok(traceId, job);
  }

  completeExportJob(
    jobId: string,
    body: CompleteExportJobRequestDto
  ): ApiResponse<CompleteExportJobResponseDto> | ApiError {
    const traceId = createTraceId();
    const updated = this.exportService.completeExportJob(jobId, body);
    if (!updated) {
      return fail(traceId, "EXPORT_JOB_NOT_FOUND", "export job not found or terminal");
    }

    return ok(
      traceId,
      {
        jobId,
        status: body.status
      },
      "ack"
    );
  }
}
