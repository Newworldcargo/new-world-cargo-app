import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { addressToViewModel, invoiceToViewModel, recipientToViewModel, referenceDataToViewModel, shipmentToViewModel } from "./mappers";
import type { AddressInput, FileUploadIntentInput, PaymentIntentInput, PickupInput, RecipientInput, ReturnRequestInput, ShipmentAction, SupportCaseInput } from "./contracts";
import type { InvoiceListFilters, ShipmentListFilters } from "./ports";
import { queryKeys } from "./query-keys";
import { customerPortalRepository } from "./repository";

function useCustomerScope() {
  const { user, isAuthenticated } = useAuth();
  return { customerId: user?.id ?? "anonymous", enabled: isAuthenticated && Boolean(user?.id) };
}

function requireCustomerScope(scope: ReturnType<typeof useCustomerScope>) {
  if (!scope.enabled) throw new Error("Sign in before changing customer records.");
  return { customerId: scope.customerId };
}

export function useCustomerShipments(filters: ShipmentListFilters = {}) {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.shipments.list(scope.customerId, filters),
    queryFn: () => customerPortalRepository.listShipments({ customerId: scope.customerId }, filters).then((records) => records.map(shipmentToViewModel)),
    enabled: scope.enabled,
  });
}

export function useCustomerShipment(shipmentId: string | undefined) {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.shipments.detail(scope.customerId, shipmentId ?? "missing"),
    queryFn: () => customerPortalRepository.getShipment({ customerId: scope.customerId }, shipmentId!).then((record) => record ? shipmentToViewModel(record) : null),
    enabled: scope.enabled && Boolean(shipmentId),
  });
}

export function usePublicTracking(trackingNumber: string) {
  return useQuery({
    queryKey: queryKeys.shipments.tracking(trackingNumber),
    queryFn: () => customerPortalRepository.getPublicTracking(trackingNumber).then((record) => record ? shipmentToViewModel(record) : null),
    enabled: Boolean(trackingNumber.trim()),
    staleTime: 30_000,
  });
}

export function useCustomerInvoices(filters: InvoiceListFilters = {}) {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.invoices.list(scope.customerId, filters),
    queryFn: () => customerPortalRepository.listInvoices({ customerId: scope.customerId }, filters).then((records) => records.map(invoiceToViewModel)),
    enabled: scope.enabled,
    staleTime: 120_000,
  });
}

export function useCustomerInvoice(invoiceId: string | undefined) {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.invoices.detail(scope.customerId, invoiceId ?? "missing"),
    queryFn: () => customerPortalRepository.getInvoice({ customerId: scope.customerId }, invoiceId!).then((record) => record ? invoiceToViewModel(record) : null),
    enabled: scope.enabled && Boolean(invoiceId),
    staleTime: 120_000,
  });
}

export function useCustomerWallet() {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.wallet.detail(scope.customerId),
    queryFn: () => customerPortalRepository.getWallet({ customerId: scope.customerId }),
    enabled: scope.enabled,
    staleTime: 30_000,
  });
}

export function useCustomerAddresses() {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.profile.addresses(scope.customerId),
    queryFn: () => customerPortalRepository.listAddresses({ customerId: scope.customerId }).then((records) => records.map(addressToViewModel)),
    enabled: scope.enabled,
    staleTime: 300_000,
  });
}

export function useCustomerRecipients(query = "") {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.profile.recipients(scope.customerId, query),
    queryFn: () => customerPortalRepository.listRecipients({ customerId: scope.customerId }, query).then((records) => records.map(recipientToViewModel)),
    enabled: scope.enabled,
    staleTime: 300_000,
  });
}

export function useCustomerDrafts() {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: ["customer", scope.customerId, "shipment-drafts"],
    queryFn: () => customerPortalRepository.listShipmentDrafts({ customerId: scope.customerId }),
    enabled: scope.enabled,
    staleTime: 30_000,
  });
}

export function useShipmentDraftMutations() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customer", scope.customerId, "shipment-drafts"] });
  const invalidateShipments = () => queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all(scope.customerId) });
  return {
    create: useMutation({ mutationFn: (input: { payload: Record<string, unknown>; expiresAt?: string | null }) => customerPortalRepository.createShipmentDraft(requireCustomerScope(scope), input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.submitShipmentDraft(requireCustomerScope(scope), id, revision), onSuccess: () => { invalidate(); invalidateShipments(); } }),
    remove: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.deleteShipmentDraft(requireCustomerScope(scope), id, revision), onSuccess: invalidate }),
  };
}

export function useCustomerReferenceData() {
  return useQuery({
    queryKey: queryKeys.referenceData(),
    queryFn: () => customerPortalRepository.getReferenceData().then(referenceDataToViewModel),
    staleTime: 86_400_000,
  });
}

export function useCustomerNotifications() {
  const scope = useCustomerScope();
  return useQuery({
    queryKey: queryKeys.notifications.list(scope.customerId),
    queryFn: () => customerPortalRepository.listNotifications({ customerId: scope.customerId }),
    enabled: scope.enabled,
    staleTime: 30_000,
  });
}

export function useNotificationMutations() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(scope.customerId) });
  return {
    markRead: useMutation({
      mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.markNotificationRead(requireCustomerScope(scope), id, revision),
      onSuccess: invalidate,
    }),
    markAllRead: useMutation({
      mutationFn: () => customerPortalRepository.markAllNotificationsRead(requireCustomerScope(scope), crypto.randomUUID()),
      onSuccess: invalidate,
    }),
  };
}

export function useCustomerSupportCases() {
  const scope = useCustomerScope();
  return useQuery({ queryKey: queryKeys.support.list(scope.customerId), queryFn: () => customerPortalRepository.listSupportCases({ customerId: scope.customerId }), enabled: scope.enabled, staleTime: 30_000 });
}

export function useSupportCaseMutation() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<SupportCaseInput, "idempotencyKey">) => customerPortalRepository.createSupportCase(requireCustomerScope(scope), { ...input, idempotencyKey: crypto.randomUUID() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.list(scope.customerId) }),
  });
}

export function useCustomerReturnRequests() {
  const scope = useCustomerScope();
  return useQuery({ queryKey: queryKeys.returns.list(scope.customerId), queryFn: () => customerPortalRepository.listReturnRequests({ customerId: scope.customerId }), enabled: scope.enabled, staleTime: 30_000 });
}

export function useReturnRequestMutation() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ReturnRequestInput, "idempotencyKey">) => customerPortalRepository.createReturnRequest(requireCustomerScope(scope), { ...input, idempotencyKey: crypto.randomUUID() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.returns.list(scope.customerId) }),
  });
}

export function useCustomerPickup() {
  const scope = useCustomerScope();
  return useQuery({ queryKey: queryKeys.pickups.detail(scope.customerId), queryFn: () => customerPortalRepository.getPickup({ customerId: scope.customerId }), enabled: scope.enabled, staleTime: 30_000 });
}

export function usePickupMutations() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.pickups.detail(scope.customerId) });
  return {
    schedule: useMutation({ mutationFn: (input: Omit<PickupInput, "idempotencyKey">) => customerPortalRepository.schedulePickup(requireCustomerScope(scope), { ...input, idempotencyKey: crypto.randomUUID() }), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.cancelPickup(requireCustomerScope(scope), id, revision, crypto.randomUUID()), onSuccess: invalidate }),
  };
}

export function useCustomerSessionActivity() {
  const scope = useCustomerScope();
  return useQuery({ queryKey: queryKeys.security.sessions(scope.customerId), queryFn: () => customerPortalRepository.listSessionActivity({ customerId: scope.customerId }), enabled: scope.enabled, staleTime: 30_000 });
}

export function useSessionActivityMutations() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.security.sessions(scope.customerId) });
  return {
    setTrust: useMutation({ mutationFn: ({ id, revision, trusted }: { id: string; revision: number; trusted: boolean }) => customerPortalRepository.setSessionTrust(requireCustomerScope(scope), id, revision, trusted), onSuccess: invalidate }),
    revoke: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.revokeSession(requireCustomerScope(scope), id, revision, crypto.randomUUID()), onSuccess: invalidate }),
  };
}

export function useAddressMutations() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.addresses(scope.customerId) });

  return {
    create: useMutation({ mutationFn: (input: AddressInput) => customerPortalRepository.createAddress(requireCustomerScope(scope), input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, revision, input }: { id: string; revision: number; input: AddressInput }) => customerPortalRepository.updateAddress(requireCustomerScope(scope), id, revision, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.deleteAddress(requireCustomerScope(scope), id, revision), onSuccess: invalidate }),
    setDefault: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.setDefaultAddress(requireCustomerScope(scope), id, revision), onSuccess: invalidate }),
  };
}

export function useRecipientMutations() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.recipients(scope.customerId) });

  return {
    create: useMutation({ mutationFn: (input: RecipientInput) => customerPortalRepository.createRecipient(requireCustomerScope(scope), input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, revision, input }: { id: string; revision: number; input: RecipientInput }) => customerPortalRepository.updateRecipient(requireCustomerScope(scope), id, revision, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ id, revision }: { id: string; revision: number }) => customerPortalRepository.deleteRecipient(requireCustomerScope(scope), id, revision), onSuccess: invalidate }),
  };
}

export function useShipmentActionMutation() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentId, revision, action }: { shipmentId: string; revision: number; action: ShipmentAction }) => customerPortalRepository.performShipmentAction(requireCustomerScope(scope), shipmentId, revision, action, crypto.randomUUID()),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all(scope.customerId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all(scope.customerId) }),
    ]),
  });
}

export function usePaymentIntentMutation() {
  const scope = useCustomerScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<PaymentIntentInput, "idempotencyKey">) => customerPortalRepository.createPaymentIntent(requireCustomerScope(scope), { ...input, idempotencyKey: crypto.randomUUID() }),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all(scope.customerId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.detail(scope.customerId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(scope.customerId) }),
    ]),
  });
}

export function useFileUploadIntentMutation() {
  const scope = useCustomerScope();
  return useMutation({
    mutationFn: (input: Omit<FileUploadIntentInput, "idempotencyKey">) => customerPortalRepository.createFileUploadIntent(requireCustomerScope(scope), { ...input, idempotencyKey: crypto.randomUUID() }),
  });
}

export function useCompleteFileUploadMutation() {
  const scope = useCustomerScope();
  return useMutation({
    mutationFn: (fileId: string) => customerPortalRepository.completeFileUpload(requireCustomerScope(scope), fileId),
  });
}
