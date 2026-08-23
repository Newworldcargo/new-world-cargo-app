import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShipmentDraftSnapshot = {
  id: string;
  step: number;
  payload: Record<string, unknown>;
  updatedAt: string;
};

export type QuoteHandoffSnapshot = {
  id: string;
  from: string;
  to: string;
  weightKg: number;
  packageSize: string;
  serviceId: string;
  serviceName: string;
  expiresAt: string;
};

export type PreferredPaymentMethod = "mobile-money" | "card";

type CustomerWorkflowState = {
  shipmentDrafts: Record<string, ShipmentDraftSnapshot>;
  latestQuote: QuoteHandoffSnapshot | null;
  preferredPaymentMethod: PreferredPaymentMethod | null;
  saveShipmentDraft: (draft: ShipmentDraftSnapshot) => void;
  removeShipmentDraft: (draftId: string) => void;
  setLatestQuote: (quote: QuoteHandoffSnapshot | null) => void;
  setPreferredPaymentMethod: (method: PreferredPaymentMethod) => void;
  clearCustomerWorkflowState: () => void;
};

/**
 * This store intentionally contains only device-local, non-authoritative workflow state.
 * Customer records, shipment status, billing, identity and payment outcomes always belong
 * to the server-facing repository layer and must never be persisted here.
 */
export const useCustomerWorkflowStore = create<CustomerWorkflowState>()(
  persist(
    (set) => ({
      shipmentDrafts: {},
      latestQuote: null,
      preferredPaymentMethod: null,
      saveShipmentDraft: (draft) => set((state) => ({ shipmentDrafts: { ...state.shipmentDrafts, [draft.id]: draft } })),
      removeShipmentDraft: (draftId) => set((state) => {
        const { [draftId]: _removed, ...shipmentDrafts } = state.shipmentDrafts;
        return { shipmentDrafts };
      }),
      setLatestQuote: (latestQuote) => set({ latestQuote }),
      setPreferredPaymentMethod: (preferredPaymentMethod) => set({ preferredPaymentMethod }),
      clearCustomerWorkflowState: () => set({ shipmentDrafts: {}, latestQuote: null, preferredPaymentMethod: null }),
    }),
    {
      name: "nwc-customer-workflow-v1",
      partialize: (state) => ({
        shipmentDrafts: state.shipmentDrafts,
        latestQuote: state.latestQuote,
        preferredPaymentMethod: state.preferredPaymentMethod,
      }),
    },
  ),
);
