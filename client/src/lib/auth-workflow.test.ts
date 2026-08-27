import { describe, expect, it } from "vitest";
import { buildAdminResetPasswordUrl, extractResetEmail, extractResetToken, isProtectedRoute, isPublicAuthPath, isStrongPassword, otpAttemptResult, passwordRequirements, validateOtp, validateSignedInPasswordChange } from "./auth-workflow";

describe("auth workflow helpers", () => {
  it("evaluates password requirements", () => {
    expect(passwordRequirements("Cargo123")).toEqual({ length: true, uppercase: true, number: true });
    expect(isStrongPassword("cargo")).toBe(false);
    expect(isStrongPassword("Cargo123")).toBe(true);
  });

  it("keeps OTP states explicit", () => {
    expect(validateOtp("12")).toBe("incomplete");
    expect(validateOtp("000000")).toBe("expired");
    expect(validateOtp("654321")).toBe("incorrect");
    expect(validateOtp("123456")).toBeNull();
  });

  it("limits incorrect OTP attempts and supports a resend reset", () => {
    expect(otpAttemptResult("654321", 0)).toEqual({ status: "incorrect", attempts: 1 });
    expect(otpAttemptResult("654321", 1)).toEqual({ status: "incorrect", attempts: 2 });
    expect(otpAttemptResult("654321", 2)).toEqual({ status: "attempts", attempts: 3 });
    expect(otpAttemptResult("123456", 0)).toEqual({ status: null, attempts: 0 });
    expect(otpAttemptResult("123456", 3)).toEqual({ status: "attempts", attempts: 3 });
    expect(otpAttemptResult("654321", 0).attempts).toBe(1);
  });

  it("requires the current password before accepting a new password", () => {
    expect(validateSignedInPasswordChange("", "NewCargo123", "NewCargo123")).toBe("current-required");
    expect(validateSignedInPasswordChange("wrong", "NewCargo123", "NewCargo123")).toBe("current-incorrect");
    expect(validateSignedInPasswordChange("password123", "short", "short")).toBe("next-too-short");
    expect(validateSignedInPasswordChange("password123", "password123", "password123")).toBe("next-must-differ");
    expect(validateSignedInPasswordChange("password123", "NewCargo123", "Different123")).toBe("confirmation-mismatch");
    expect(validateSignedInPasswordChange("password123", "NewCargo123", "NewCargo123")).toBeNull();
  });

  it("recognizes public auth and legal routes", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/shipments/tracking")).toBe(true);
    expect(isPublicAuthPath("/settings/legal/privacy")).toBe(true);
    expect(isPublicAuthPath("/password/reset/token-123")).toBe(true);
    expect(isPublicAuthPath("/shipments")).toBe(false);
    expect(isProtectedRoute("/shipments/tracking")).toBe(false);
    expect(isProtectedRoute("/shipments")).toBe(true);
    expect(isProtectedRoute("/session-expired")).toBe(false);
  });

  it("extracts reset link context from legacy and app routes", () => {
    expect(extractResetToken("/reset-password", "?token=abc123&email=user@example.com")).toBe("abc123");
    expect(extractResetToken("/password/reset/legacy-token", "")).toBe("legacy-token");
    expect(extractResetEmail("?token=abc123&email=user@example.com")).toBe("user@example.com");
    expect(buildAdminResetPasswordUrl("abc123", "user@example.com")).toBe("https://admin.newworldcargo.com/reset-password/abc123?email=user%40example.com");
  });
});
