import type { ApiError, ApiResponse } from "@magic/types/common";
import type { GetResumeResponseDto, ImportResumeRequestDto, SaveDraftRequestDto } from "./resume.dto";
import { validateSaveDraftRequest } from "./resume.dto";
import { createTraceId, fail, ok } from "@api/common/response";
import { ResumeService } from "./resume.service";

export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  getResume(resumeId: string): ApiResponse<GetResumeResponseDto> | ApiError {
    const traceId = createTraceId();
    const resume = this.resumeService.getResume(resumeId);
    if (!resume) {
      return fail(traceId, "RESUME_NOT_FOUND", "resume not found");
    }
    return ok(traceId, { resume });
  }

  saveDraft(
    resumeId: string,
    body: SaveDraftRequestDto
  ): ApiResponse<{ resumeId: string; savedVersion: number; updatedAt: string }> | ApiError {
    const traceId = createTraceId();
    const validationErrors = validateSaveDraftRequest(body);
    if (validationErrors.length > 0) {
      return fail(
        traceId,
        "VALIDATION_ERROR",
        "request validation failed",
        validationErrors.map((error) => ({
          field: "body",
          reason: error
        }))
      );
    }

    try {
      const result = this.resumeService.saveDraft(resumeId, body);
      if (!result) {
        return fail(traceId, "RESUME_NOT_FOUND", "resume not found");
      }
      return ok(traceId, result);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("VERSION_CONFLICT")) {
        const current = error.message.replace("VERSION_CONFLICT:", "");
        return fail(traceId, "VERSION_CONFLICT", "baseVersion is stale", [
          {
            field: "baseVersion",
            reason: current
          }
        ]);
      }
      return fail(traceId, "INTERNAL_ERROR", "unexpected save error");
    }
  }

  importResume(body: ImportResumeRequestDto): ApiResponse<{ resumeId: string; version: number }> | ApiError {
    const traceId = createTraceId();
    const result = this.resumeService.importResume(body);
    return ok(traceId, result);
  }
}
