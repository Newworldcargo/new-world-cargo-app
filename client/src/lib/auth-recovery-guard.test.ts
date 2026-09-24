import { describe, expect, it } from "vitest";
import { emailRecoveryRedirect, EMAIL_RECOVERY_PATH } from "./auth-recovery-guard";

describe("email completion middleware", () => {
  it("routes login and existing session failures to email recovery", () => {
    for (const path of ["/login", "/shipments", "/send/local/route", "/settings"]) {
      expect(emailRecoveryRedirect("EMAIL_REQUIRED", path)).toBe(EMAIL_RECOVERY_PATH);
    }
  });
  it("does not loop on recovery or redirect unrelated errors", () => {
    expect(emailRecoveryRedirect("EMAIL_REQUIRED", "/recover-account")).toBeNull();
    expect(emailRecoveryRedirect("UNAUTHENTICATED", "/login")).toBeNull();
    expect(emailRecoveryRedirect("OTP_INVALID", "/recover-account")).toBeNull();
    expect(emailRecoveryRedirect(undefined, "/login")).toBeNull();
  });
});
