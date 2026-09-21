import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "./http";
import type { Money } from "./contracts";

export type OnlineBooking = {
  id: string;
  bookingId: string;
  reference: string;
  shipmentId: string | null;
  service: "local" | "intercity" | "import" | "custom";
  transportMode: "air" | "sea" | null;
  packageName: string;
  parcelOwner: string;
  origin: string;
  destination: string;
  status: "pending" | "booking_confirmed" | "cancelled";
  statusLabel: string;
  price: Money;
  events: { id: string; label: string; detail: string; displayTime: string }[];
};

export const bookingServiceLabels = {
  local: "Local delivery", intercity: "City-to-city", import: "International imports", custom: "Custom request",
};

export function useCustomerBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customer", user?.id, "bookings"],
    queryFn: () => apiRequest<OnlineBooking[]>("/bookings?per_page=50"),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
}

export function useCustomerBooking(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customer", user?.id, "bookings", id],
    queryFn: () => apiRequest<OnlineBooking>(`/bookings/${encodeURIComponent(id)}`),
    enabled: Boolean(user) && /^\d+$/.test(id),
    refetchInterval: 30_000,
  });
}
