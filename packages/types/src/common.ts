export type TraceId = string;

export interface ApiResponse<TData> {
  code: "OK";
  message: string;
  traceId: TraceId;
  data: TData;
}

export interface ApiErrorDetail {
  field: string;
  reason: string;
}

export interface ApiError {
  code: string;
  message: string;
  traceId: TraceId;
  details?: ApiErrorDetail[];
}

export type Mode = "edit" | "preview" | "both";

export type IsoDateTime = string;
