export type NotificationFilter = "unread" | "read";

export type NotificationRecord = { unread: boolean };

export type CargoRow = { name: string; quantity: string };

export function filterNotifications<T extends NotificationRecord>(items: T[], filter: NotificationFilter) {
  return items.filter((item) => filter === "unread" ? item.unread : !item.unread);
}

export function formatCargoRows(rows: CargoRow[]) {
  return rows
    .filter((row) => row.name.trim())
    .map((row) => `${row.name.trim()} × ${row.quantity || "1"}`)
    .join(", ");
}

export function hasHomeDeliveryFeeNotice(handover: "collect" | "delivery") {
  return handover === "delivery";
}
