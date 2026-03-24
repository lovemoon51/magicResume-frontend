import type {
  ImportResumeRequest,
  ImportResumeResult,
  ResumeAggregate,
  SaveDraftRequest,
  SaveDraftResult
} from "@magic/types/resume";

export interface GetResumeResponseDto {
  resume: ResumeAggregate;
}

export type SaveDraftRequestDto = SaveDraftRequest;
export type SaveDraftResponseDto = SaveDraftResult;

export type ImportResumeRequestDto = ImportResumeRequest;
export type ImportResumeResponseDto = ImportResumeResult;

export function validateSaveDraftRequest(input: SaveDraftRequestDto): string[] {
  const errors: string[] = [];
  if (!input.snapshot.resumeId) {
    errors.push("snapshot.resumeId is required");
  }
  if (input.baseVersion < 0) {
    errors.push("baseVersion must be >= 0");
  }
  if (!input.clientTs) {
    errors.push("clientTs is required");
  }
  return errors;
}
