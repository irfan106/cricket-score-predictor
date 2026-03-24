import type {
  FormatCode,
  FormatDetail,
  FormatSummary,
  PredictionListResponse,
  PredictionRequest,
  PredictionResponse,
} from "./types";

const API_BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = "Something went wrong.";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } else {
      message = await response.text();
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getFormats() {
  return request<FormatSummary[]>("/formats");
}

export function getFormatDetail(format: FormatCode) {
  return request<FormatDetail>(`/formats/${format}`);
}

export function createPrediction(payload: PredictionRequest) {
  return request<PredictionResponse>("/predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPredictionHistory(format?: FormatCode, limit = 100) {
  const search = new URLSearchParams();
  if (format) {
    search.set("format", format);
  }
  search.set("limit", String(limit));
  return request<PredictionListResponse>(`/predictions?${search.toString()}`);
}

export function clearPredictionHistory() {
  return request<{ deleted: number }>("/predictions", {
    method: "DELETE",
  });
}
