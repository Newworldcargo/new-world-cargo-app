export const AUTH_PUBLIC_PATHS = ["/login", "/register", "/verify", "/forgot-password", "/reset-password", "/auth/complete-profile", "/session-expired"] as const;

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
  return AUTH_PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`)) || pathname === "/track" || pathname === "/shipments/tracking" || pathname.startsWith("/settings/legal");
}

export function validateSignedInPasswordChange(currentPassword: string, nextPassword: string, confirmation: string, expectedCurrentPassword = "password123") {
  if (!currentPassword) return "current-required" as const;
  if (currentPassword !== expectedCurrentPassword) return "current-incorrect" as const;
  if (nextPassword.length < 8) return "next-too-short" as const;
  if (nextPassword === currentPassword) return "next-must-differ" as const;
  if (nextPassword !== confirmation) return "confirmation-mismatch" as const;
  return null;
}
