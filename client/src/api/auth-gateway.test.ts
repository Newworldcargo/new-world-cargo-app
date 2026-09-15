import { describe, expect, it } from "vitest";
import { passwordResetPayload, passwordResetRequestPayload } from "./auth-gateway";

describe("customer password recovery contract", () => {
  it("requests an OTP using the shared email-or-phone identifier field", () => {
    expect(passwordResetRequestPayload("  +260970000245  ")).toEqual({
      identifier: "+260970000245",
    });
  });

  it("resets with the six-digit OTP contract used by the mobile app", () => {
    expect(passwordResetPayload({
      identifier: " customer@example.com ",
      code: "482913",
      password: "NewCargo123",
      passwordConfirmation: "NewCargo123",
    })).toEqual({
      identifier: "customer@example.com",
      code: "482913",
      password: "NewCargo123",
      password_confirmation: "NewCargo123",
    });
  });
});
