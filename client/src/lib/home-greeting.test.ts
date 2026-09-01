import { describe, expect, it } from "vitest";
import { customerGreeting } from "./customer-greeting";

describe("homepage customer greeting", () => {
  it("uses the signed-in customer's name and Zambia time", () => {
    expect(customerGreeting("George", new Date("2026-09-01T07:00:00Z"))).toBe("Good morning, George.");
    expect(customerGreeting("George", new Date("2026-09-01T12:00:00Z"))).toBe("Good afternoon, George.");
    expect(customerGreeting("George", new Date("2026-09-01T17:00:00Z"))).toBe("Good evening, George.");
  });

  it("uses a neutral fallback when a session has no display name", () => {
    expect(customerGreeting("", new Date("2026-09-01T07:00:00Z"))).toBe("Good morning, there.");
  });
});
