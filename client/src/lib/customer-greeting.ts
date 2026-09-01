export function customerGreeting(firstName?: string, now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "Africa/Lusaka",
  }).format(now));

  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${firstName?.trim() || "there"}.`;
}
