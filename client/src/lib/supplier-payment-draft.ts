import { safeCustomerReturnPath } from "./auth-workflow";
import { supplierWizardPath } from "./payment-routes";

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
  if (![supplierPaymentPath, supplierWizardPath].includes(window.location.pathname) || !window.location.hash.startsWith("#estimate=")) return;
  try {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("estimate");
    if (value) sessionStorage.setItem(draftKey, value);
  } catch { return; }
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
}

export function supplierCurrencyForRoute(route: string) {
  return route === "Dubai" ? "AED" : "CNY";
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
    supplier_currency: currency(draft.get("supplier_currency"), supplierCurrencyForRoute(route)),
    route,
  };
}

export function rememberSupplierPaymentReturn() {
  try { sessionStorage.setItem(resumeKey, "1"); } catch { /* The direct return link still works. */ }
}

export function customerPostSignInPath() {
  const returnPath = safeCustomerReturnPath(new URLSearchParams(window.location.search).get("returnTo"));
  if (returnPath) return returnPath;
  try { return sessionStorage.getItem(resumeKey) ? supplierWizardPath : "/"; } catch { return "/"; }
}

export function clearSupplierPaymentReturn() {
  try { sessionStorage.removeItem(resumeKey); } catch { /* Storage can be disabled. */ }
}

export function clearSupplierPaymentDraft() {
  try { sessionStorage.removeItem(draftKey); } catch { /* Storage can be disabled. */ }
}


export type SupplierPaymentMethod = "office_cash" | "atm_deposit" | "card" | "mobile_money";

export type SupplierPaymentStep = "transfer" | "supplier" | "review";

type SupplierFormSnapshot = {
  payment: { amount: string; currency: string; supplier_currency: string; route: string };
  supplier: { supplier_name: string; supplier_email: string; invoice_reference: string; notes: string };
  step?: SupplierPaymentStep;
  savedSupplierId?: string;
  paymentMethod?: SupplierPaymentMethod;
  submissionKey: string;
  locked: boolean;
};

let supplierForm: { customerId: string; details: SupplierFormSnapshot } | undefined;

// Keep unsent details in this tab's memory while the same customer signs back in.
export function readSupplierForm(customerId: string | undefined) {
  if (customerId && supplierForm?.customerId === customerId) return supplierForm.details;
}

export function rememberSupplierForm(customerId: string, details: SupplierFormSnapshot) {
  supplierForm = { customerId, details };
}

export function clearSupplierForm() {
  supplierForm = undefined;
}
