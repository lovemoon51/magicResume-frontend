import type { ApiError, ApiResponse } from "@magic/types/common";

export class HttpException extends Error {
  public readonly code: string;
  public readonly traceId: string;
  public readonly details: ApiError["details"];

  constructor(payload: ApiError) {
    super(payload.message);
    this.code = payload.code;
    this.traceId = payload.traceId;
    this.details = payload.details;
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.headers = options.headers ?? {};
  }

  async get<TData>(path: string): Promise<TData> {
    return this.request<TData>(path, {
      method: "GET"
    });
  }

  async post<TData, TBody>(path: string, body: TBody): Promise<TData> {
    return this.request<TData>(path, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  async patch<TData, TBody>(
    path: string,
    body: TBody,
    headers?: Record<string, string>
  ): Promise<TData> {
    return this.request<TData>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers
    });
  }

  private async request<TData>(
    path: string,
    init: RequestInit
  ): Promise<TData> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...(init.headers ?? {})
      }
    });

    const json = (await response.json()) as ApiResponse<TData> | ApiError;

    if (!response.ok || ("code" in json && json.code !== "OK")) {
      throw new HttpException(json as ApiError);
    }

    return (json as ApiResponse<TData>).data;
  }
}
