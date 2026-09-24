export const EMAIL_RECOVERY_PATH = "/recover-account?reason=email-required";

export function emailRecoveryRedirect(code: string | undefined, pathname: string): string | null {
  if (code !== "EMAIL_REQUIRED" || pathname === "/recover-account" || pathname.startsWith("/recover-account/")) return null;
  return EMAIL_RECOVERY_PATH;
}
