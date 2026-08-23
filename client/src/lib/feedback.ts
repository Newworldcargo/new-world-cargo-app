import { toast, type ExternalToast } from "sonner";

type FeedbackOptions = ExternalToast;

const withDefaults = (duration: number, options?: FeedbackOptions): FeedbackOptions => ({ duration, ...options });

function getErrorDescription(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const candidate = error as { code?: unknown; message?: unknown };
  if (candidate.code === "NETWORK_UNAVAILABLE") return "Check your connection and try again.";
  if (candidate.code === "REQUEST_TIMEOUT") return "The service took too long to respond. Please try again.";
  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
  return fallback;
}

/**
 * The single feedback vocabulary for customer-visible asynchronous outcomes.
 * Inline validation and accessible page states remain in place; these messages
 * add timely confirmation without making a toast the only source of feedback.
 */
export const feedback = {
  success: (message: string, options?: FeedbackOptions) => toast.success(message, withDefaults(4_000, options)),
  info: (message: string, options?: FeedbackOptions) => toast.info(message, withDefaults(4_500, options)),
  warning: (message: string, options?: FeedbackOptions) => toast.warning(message, withDefaults(5_500, options)),
  error: (message: string, options?: FeedbackOptions) => toast.error(message, withDefaults(6_000, options)),
  fromError: (error: unknown, title = "We couldn't complete that action") => toast.error(title, withDefaults(6_000, {
    description: getErrorDescription(error, "Please try again. Your saved details are still available."),
  })),
};

export { getErrorDescription };
