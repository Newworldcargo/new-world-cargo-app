import { apiProblemSchema, type ApiSuccess } from "./contracts";
import { CustomerApiError } from "./errors";

const adminApiOrigin = "https://admin.newworldcargo.com";
const apiBaseUrl = `${adminApiOrigin}/api`;
export const apiRequestTimeoutMs = 15_000;
const csrfHeaderName = "X-CSRF-Token";
let cachedCsrfToken: string | undefined;

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; signal?: AbortSignal };

function requestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `nwc-${Date.now()}`;
}

function csrfToken() {
  if (typeof document !== "undefined") {
    const cookieToken = document.cookie.split("; ").find((entry) => entry.startsWith("nwc_csrf="))?.split("=").slice(1).join("=");
    if (cookieToken) {
      cachedCsrfToken = cookieToken;
      return cookieToken;
    }
  }

  return cachedCsrfToken;
}

function resolveAdminApiPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/v1/")) {
    return normalizedPath;
  }

  return `/v1${normalizedPath}`;
}

function rememberCsrfToken(response: Response) {
  const responseToken = response.headers.get(csrfHeaderName);
  if (responseToken) {
    cachedCsrfToken = responseToken;
  }
}

function createRequestSignal(externalSignal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, apiRequestTimeoutMs);
  const abortFromCaller = () => controller.abort();
  externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestSignal = createRequestSignal(options.signal);
  let response: Response;
  const resolvedPath = resolveAdminApiPath(path);
  try {
    response = await fetch(`${apiBaseUrl}${resolvedPath}`, {
      ...options,
      signal: requestSignal.signal,
      credentials: "include",
      mode: "cors",
      headers: {
        Accept: "application/json",
        "X-Request-ID": requestId(),
        ...(csrfToken() ? { [csrfHeaderName]: csrfToken() } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    rememberCsrfToken(response);
  } catch (error) {
    if (requestSignal.didTimeout()) {
      throw new CustomerApiError(408, { error: { code: "REQUEST_TIMEOUT", message: "The request took too long. Please try again.", retryable: true } });
    }
    if (requestSignal.signal.aborted) throw error;
    throw new CustomerApiError(503, { error: { code: "NETWORK_UNAVAILABLE", message: "We could not reach New World Cargo. Please check your connection and try again.", retryable: true } });
  } finally {
    requestSignal.cleanup();
  }

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
