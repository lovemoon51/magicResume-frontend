import type { IsoDateTime } from "./common.js";

export type ExportStatus = "queued" | "processing" | "succeeded" | "failed";

export interface CreateExportJobRequest {
  templateId: string;
  snapshotVersion: number;
  format: "pdf";
}

export interface CreateExportJobResult {
  jobId: string;
  status: ExportStatus;
}

export interface ExportJobResult {
  jobId: string;
  status: ExportStatus;
  downloadUrl: string;
  errorCode: string;
  errorMessage: string;
}

export interface ResumeExportMessage {
  jobId: string;
  resumeId: string;
  snapshotVersion: number;
  templateId: string;
  requestedBy: string;
  traceId: string;
  createdAt: IsoDateTime;
}

export interface ExportJobCompleteRequest {
  status: "succeeded" | "failed";
  fileKey?: string;
  downloadUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  finishedAt: IsoDateTime;
  traceId: string;
}

export interface ExportJobCompleteResult {
  jobId: string;
  status: "succeeded" | "failed";
}
