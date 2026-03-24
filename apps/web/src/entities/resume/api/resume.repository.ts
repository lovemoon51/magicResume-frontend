import type {
  ImportResumeRequest,
  ImportResumeResult,
  ResumeAggregate,
  SaveDraftRequest,
  SaveDraftResult
} from "@magic/types/resume";
import type {
  CreateExportJobRequest,
  CreateExportJobResult,
  ExportJobResult
} from "@magic/types/export";
import { HttpClient } from "@web/shared/api/http";
import {
  mapAggregateToResumeDto,
  mapResumeDtoToAggregate
} from "@web/entities/resume/model/resume.mapper";

export interface ResumeRepository {
  getResume(resumeId: string): Promise<ResumeAggregate>;
  saveDraft(resumeId: string, request: SaveDraftRequest): Promise<SaveDraftResult>;
  importResume(request: ImportResumeRequest): Promise<ImportResumeResult>;
  createExportJob(
    resumeId: string,
    request: CreateExportJobRequest
  ): Promise<CreateExportJobResult>;
  getExportJob(jobId: string): Promise<ExportJobResult>;
}

interface ResumeDtoResponse {
  resume: ResumeAggregate;
}

export class HttpResumeRepository implements ResumeRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getResume(resumeId: string): Promise<ResumeAggregate> {
    const data = await this.httpClient.get<ResumeDtoResponse>(
      `/api/v1/resumes/${resumeId}`
    );
    return mapResumeDtoToAggregate(data);
  }

  async saveDraft(
    resumeId: string,
    request: SaveDraftRequest
  ): Promise<SaveDraftResult> {
    return this.httpClient.patch<SaveDraftResult, SaveDraftRequest>(
      `/api/v1/resumes/${resumeId}/draft`,
      {
        ...request,
        snapshot: mapAggregateToResumeDto(request.snapshot).resume
      }
    );
  }

  async importResume(request: ImportResumeRequest): Promise<ImportResumeResult> {
    return this.httpClient.post<ImportResumeResult, ImportResumeRequest>(
      "/api/v1/resumes/import",
      request
    );
  }

  async createExportJob(
    resumeId: string,
    request: CreateExportJobRequest
  ): Promise<CreateExportJobResult> {
    return this.httpClient.post<CreateExportJobResult, CreateExportJobRequest>(
      `/api/v1/resumes/${resumeId}/export-jobs`,
      request
    );
  }

  async getExportJob(jobId: string): Promise<ExportJobResult> {
    return this.httpClient.get<ExportJobResult>(`/api/v1/export-jobs/${jobId}`);
  }
}
