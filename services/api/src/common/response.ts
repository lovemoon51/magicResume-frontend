import type { ApiError, ApiResponse } from "@magic/types/common";

export function ok<T>(traceId: string, data: T, message = "success"): ApiResponse<T> {
  return {
    code: "OK",
    message,
    traceId,
    data
  };
}

export function fail(
  traceId: string,
  code: string,
  message: string,
  details?: ApiError["details"]
): ApiError {
  return {
    code,
    message,
    traceId,
    details
  };
}

export function createTraceId(): string {
  return Math.random().toString(16).slice(2, 18);
}
