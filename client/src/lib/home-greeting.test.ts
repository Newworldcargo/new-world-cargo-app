import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../..", import.meta.url);

describe("homepage customer greeting", () => {
  it("greets Peter", () => {
    const home = readFileSync(new URL("client/src/pages/Home.tsx", root), "utf8");

    expect(home).toContain("Good afternoon, Peter.");
    expect(home).not.toContain("Good afternoon, Amina.");
  });
});

