import { MutationCache, QueryClient } from "@tanstack/react-query";
import { feedback } from "@/lib/feedback";
import { isCustomerApiError } from "./errors";

export const customerQueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => feedback.fromError(error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (attempt, error) => attempt < 1 && (!isCustomerApiError(error) || error.retryable),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
