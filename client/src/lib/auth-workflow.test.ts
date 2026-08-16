import { describe, expect, it } from "vitest";
import { isProtectedRoute, isPublicAuthPath, isStrongPassword, otpAttemptResult, passwordRequirements, validateOtp } from "./auth-workflow";

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

  it("recognizes public auth and legal routes", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/settings/legal/privacy")).toBe(true);
    expect(isPublicAuthPath("/shipments")).toBe(false);
    expect(isProtectedRoute("/shipments")).toBe(true);
    expect(isProtectedRoute("/session-expired")).toBe(false);
  });
});
