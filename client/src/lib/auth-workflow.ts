export const AUTH_PUBLIC_PATHS = ["/recover-account", "/login", "/register", "/verify", "/forgot-password", "/reset-password", "/auth/complete-profile", "/session-expired"] as const;
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

export type RegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
};

export type RegistrationFieldErrors = Partial<Record<keyof RegistrationForm | "accepted", string>>;

export function validateRegistration(form: RegistrationForm, accepted: boolean): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {};
  if (form.firstName.trim().length < 2) errors.firstName = "Enter a first name with at least 2 characters.";
  if (form.lastName.trim() && form.lastName.trim().length < 2) errors.lastName = "Enter a complete last name or leave it blank.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  const phoneDigits = form.phone.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) errors.phone = "Enter a valid phone number with 9 to 15 digits.";
  if (!isStrongPassword(form.password)) errors.password = "Use at least 8 characters, one uppercase letter, and one number.";
  if (!form.confirm) errors.confirm = "Confirm your password.";
  else if (form.password !== form.confirm) errors.confirm = "Your passwords do not match.";
  if (!accepted) errors.accepted = "Accept the Terms and Privacy Policy to continue.";
  return errors;
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

export function extractRecoveryIdentifier(search: string) {
  const params = new URLSearchParams(search);
  return params.get("identifier")?.trim() || params.get("email")?.trim() || null;
}

export function buildAdminResetPasswordUrl(token: string, email: string) {
  return `${ADMIN_AUTH_ORIGIN}/reset-password/${encodeURIComponent(token)}?email=${encodeURIComponent(email)}`;
}
