import type {
  CreateExportJobRequest,
  CreateExportJobResult,
  ExportJobCompleteRequest,
  ExportJobCompleteResult,
  ExportJobResult,
  ResumeExportMessage
} from "@magic/types/export";

export type CreateExportJobRequestDto = CreateExportJobRequest;
export type CreateExportJobResponseDto = CreateExportJobResult;

export type GetExportJobResponseDto = ExportJobResult;

export type ExportQueueMessageDto = ResumeExportMessage;

export type CompleteExportJobRequestDto = ExportJobCompleteRequest;
export type CompleteExportJobResponseDto = ExportJobCompleteResult;
