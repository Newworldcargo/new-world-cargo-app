export const AUTH_PUBLIC_PATHS = ["/login", "/register", "/verify", "/forgot-password", "/reset-password", "/auth/complete-profile", "/session-expired"] as const;
export const ADMIN_AUTH_ORIGIN = "https://admin.newworldcargo.com";
const VERIFY_PENDING_KEY = "nwc_auth_verify_pending";
const RESET_TOKEN_KEYS = ["token", "reset_token"] as const;

export function passwordRequirements(password: string) {
  return { length: password.length >= 8, uppercase: /[A-Z]/.test(password), number: /\d/.test(password) };
}

export function isStrongPassword(password: string) {
  const requirements = passwordRequirements(password);
  return requirements.length && requirements.uppercase && requirements.number;
}

export function validateOtp(code: string) {
  if (code.length < 6) return "incomplete" as const;
  if (code === "000000") return "expired" as const;
  if (code !== "123456") return "incorrect" as const;
  return null;
}

export function otpAttemptResult(code: string, attempts: number) {
  if (attempts >= 3) return { status: "attempts" as const, attempts };
  const validation = validateOtp(code);
  if (validation === "incorrect") {
    const nextAttempts = attempts + 1;
    return { status: nextAttempts >= 3 ? "attempts" as const : "incorrect" as const, attempts: nextAttempts };
  }
  return { status: validation, attempts };
}

export function isProtectedRoute(pathname: string) {
  return !isPublicAuthPath(pathname);
}

export function isPublicAuthPath(pathname: string) {
  return AUTH_PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
    || pathname === "/track"
    || pathname === "/shipments/tracking"
    || pathname.startsWith("/shipments/tracking/")
    || /^\/[a-z]{2}\/shipments\/tracking(\/|$)/i.test(pathname)
    || pathname.startsWith("/settings/legal")
    || pathname.startsWith("/password/reset");
}

export function validateSignedInPasswordChange(currentPassword: string, nextPassword: string, confirmation: string, expectedCurrentPassword = "password123") {
  if (!currentPassword) return "current-required" as const;
  if (currentPassword !== expectedCurrentPassword) return "current-incorrect" as const;
  if (nextPassword.length < 8) return "next-too-short" as const;
  if (nextPassword === currentPassword) return "next-must-differ" as const;
  if (nextPassword !== confirmation) return "confirmation-mismatch" as const;
  return null;
}

export function markVerificationPending() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(VERIFY_PENDING_KEY, "1");
}

export function clearVerificationPending() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(VERIFY_PENDING_KEY);
}

export function hasVerificationPending() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(VERIFY_PENDING_KEY) === "1";
}

export function extractResetToken(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  for (const key of RESET_TOKEN_KEYS) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }

  const pathMatch = pathname.match(/^\/(?:password\/reset|reset-password)\/([^/?#]+)/i);
  return pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : null;
}

export function extractResetEmail(search: string) {
  const params = new URLSearchParams(search);
  const email = params.get("email")?.trim();
  return email || null;
}

export function buildAdminResetPasswordUrl(token: string, email: string) {
  return `${ADMIN_AUTH_ORIGIN}/reset-password/${encodeURIComponent(token)}?email=${encodeURIComponent(email)}`;
}
