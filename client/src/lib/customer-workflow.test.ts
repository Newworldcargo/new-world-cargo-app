import { describe, expect, it } from "vitest";
import { filterNotifications, formatCargoRows, hasHomeDeliveryFeeNotice } from "./customer-workflow";

describe("customer workflow helpers", () => {
  it("filters unread and read notifications", () => {
    const items = [{ unread: true, id: 1 }, { unread: false, id: 2 }, { unread: true, id: 3 }];
    expect(filterNotifications(items, "unread").map((item) => item.id)).toEqual([1, 3]);
    expect(filterNotifications(items, "read").map((item) => item.id)).toEqual([2]);
  });

  it("formats only named cargo rows with a quantity fallback", () => {
    expect(formatCargoRows([{ name: "Chairs", quantity: "3" }, { name: "", quantity: "2" }, { name: "Tables", quantity: "" }])).toBe("Chairs × 3, Tables × 1");
  });

  it("flags home delivery as potentially fee-bearing", () => {
    expect(hasHomeDeliveryFeeNotice("delivery")).toBe(true);
    expect(hasHomeDeliveryFeeNotice("collect")).toBe(false);
  });
});
