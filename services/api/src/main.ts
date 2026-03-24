import type { ApiError, ApiResponse } from "@magic/types/common";
import type {
  ImportResumeResponseDto,
  ImportResumeRequestDto,
  SaveDraftResponseDto,
  SaveDraftRequestDto
} from "@api/modules/resume/resume.dto";
import type { ResumeAggregate } from "@magic/types/resume";
import type {
  CompleteExportJobResponseDto,
  CompleteExportJobRequestDto,
  CreateExportJobRequestDto,
  CreateExportJobResponseDto,
  GetExportJobResponseDto
} from "@api/modules/export/export.dto";
import { InMemoryResumeExportQueue } from "@api/modules/export/export.queue";
import { ExportController } from "@api/modules/export/export.controller";
import { ExportService } from "@api/modules/export/export.service";
import { ResumeController } from "@api/modules/resume/resume.controller";
import { ResumeService } from "@api/modules/resume/resume.service";

export const serviceName = "magic-resume-api";

export class ApiApplication {
  readonly queue = new InMemoryResumeExportQueue();
  readonly resumeService = new ResumeService();
  readonly exportService = new ExportService(this.queue, this.resumeService);
  readonly resumeController = new ResumeController(this.resumeService);
  readonly exportController = new ExportController(this.exportService);

  getResume(resumeId: string): ApiResponse<{ resume: ResumeAggregate }> | ApiError {
    return this.resumeController.getResume(resumeId);
  }

  getResumeSnapshot(resumeId: string): ResumeAggregate | null {
    return this.resumeService.getResume(resumeId);
  }

  saveDraft(
    resumeId: string,
    body: SaveDraftRequestDto
  ): ApiResponse<SaveDraftResponseDto> | ApiError {
    return this.resumeController.saveDraft(resumeId, body);
  }

  importResume(
    body: ImportResumeRequestDto
  ): ApiResponse<ImportResumeResponseDto> | ApiError {
    return this.resumeController.importResume(body);
  }

  createExportJob(
    resumeId: string,
    body: CreateExportJobRequestDto
  ): ApiResponse<CreateExportJobResponseDto> | ApiError {
    return this.exportController.createExportJob(resumeId, body);
  }

  getExportJob(jobId: string): ApiResponse<GetExportJobResponseDto> | ApiError {
    return this.exportController.getExportJob(jobId);
  }

  markExportJobProcessing(jobId: string): boolean {
    return this.exportService.setProcessing(jobId);
  }

  completeExportJob(
    jobId: string,
    body: CompleteExportJobRequestDto
  ): ApiResponse<CompleteExportJobResponseDto> | ApiError {
    return this.exportController.completeExportJob(jobId, body);
  }
}
