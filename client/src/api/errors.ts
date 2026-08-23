import type { ApiProblem } from "./contracts";

export class CustomerApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryable: boolean;
  readonly requestId?: string;

  constructor(status: number, problem: ApiProblem, fallbackMessage = "We could not complete that request.") {
    super(problem.error.message || fallbackMessage);
    this.name = "CustomerApiError";
    this.status = status;
    this.code = problem.error.code;
    this.fieldErrors = problem.error.fieldErrors;
    this.retryable = Boolean(problem.error.retryable) || status >= 500;
    this.requestId = problem.requestId;
  }
}

export function isCustomerApiError(error: unknown): error is CustomerApiError {
  return error instanceof CustomerApiError;
}

