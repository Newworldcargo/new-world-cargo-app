import { QueryClient } from "@tanstack/react-query";
import { isCustomerApiError } from "./errors";

export const customerQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (attempt, error) => attempt < 1 && (!isCustomerApiError(error) || error.retryable),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

