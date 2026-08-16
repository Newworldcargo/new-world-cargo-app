export type CustomerPageState = "content" | "loading" | "empty" | "error";

const supportedStates = new Set<CustomerPageState>(["loading", "empty", "error"]);

/**
 * Reads the optional, deterministic UI-state preview from a route query string.
 * It keeps mocked customer routes testable without coupling pages to a backend.
 */
export function getCustomerPageState(search: string): CustomerPageState {
  const requested = new URLSearchParams(search).get("state");
  return requested && supportedStates.has(requested as CustomerPageState)
    ? requested as CustomerPageState
    : "content";
}
