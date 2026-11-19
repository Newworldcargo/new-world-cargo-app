export const supplierPaymentPath = "/supplier-payments";
export const supplierCurrencies = ["ZMW", "USD", "CNY", "AED", "EUR", "GBP", "ZAR"] as const;
const draftKey = "nwc.supplier-payment.estimate.v1";
const resumeKey = "nwc.supplier-payment.resume.v1";

export function isSupplierAmount(value: string) {
  return /^\d{1,10}(\.\d{1,2})?$/.test(value) && Number(value) >= 0.01;
}

function currency(value: string | null, fallback: string) {
  return supplierCurrencies.some(code => code === value) ? value! : fallback;
}

export function captureSupplierPaymentDraft() {
  if (window.location.pathname !== supplierPaymentPath || !window.location.hash.startsWith("#estimate=")) return;
  try {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("estimate");
    if (value) sessionStorage.setItem(draftKey, value);
  } catch { return; }
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
}

export function readSupplierPaymentDraft() {
  let value = "";
  try { value = sessionStorage.getItem(draftKey) || ""; } catch { /* Storage can be disabled. */ }
  const draft = new URLSearchParams(value);
  const route = draft.get("route") === "Dubai" ? "Dubai" : "China";
  const amount = draft.get("amount") || "";
  const receives = draft.get("receives") || "";
  return {
    receives: isSupplierAmount(receives) ? receives : "",
    amount: isSupplierAmount(amount) ? amount : "",
    currency: currency(draft.get("currency"), "ZMW"),
    supplier_currency: currency(draft.get("supplier_currency"), route === "Dubai" ? "AED" : "CNY"),
    route,
  };
}

export function rememberSupplierPaymentReturn() {
  try { sessionStorage.setItem(resumeKey, "1"); } catch { /* The direct return link still works. */ }
}

export function resumeSupplierPaymentOrHome() {
  if (new URLSearchParams(window.location.search).get("returnTo") === supplierPaymentPath) return supplierPaymentPath;
  try { return sessionStorage.getItem(resumeKey) ? supplierPaymentPath : "/"; } catch { return "/"; }
}

export function clearSupplierPaymentReturn() {
  try { sessionStorage.removeItem(resumeKey); } catch { /* Storage can be disabled. */ }
}

export function clearSupplierPaymentDraft() {
  try { sessionStorage.removeItem(draftKey); } catch { /* Storage can be disabled. */ }
}
