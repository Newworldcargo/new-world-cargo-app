import { apiProblemSchema, type ApiSuccess } from "./contracts";
import { CustomerApiError } from "./errors";

const apiBaseUrl = (import.meta.env.VITE_NWC_API_BASE_URL || "/api/v1").replace(/\/$/, "");

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; signal?: AbortSignal };

function requestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `nwc-${Date.now()}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Request-ID": requestId(),
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedProblem = apiProblemSchema.safeParse(payload);
    throw new CustomerApiError(
      response.status,
      parsedProblem.success
        ? parsedProblem.data
        : { error: { code: `HTTP_${response.status}`, message: "We could not complete that request.", retryable: response.status >= 500 } },
    );
  }

  const envelope = payload as ApiSuccess<T> | T;
  return "data" in (envelope as object) ? (envelope as ApiSuccess<T>).data : (envelope as T);
}

