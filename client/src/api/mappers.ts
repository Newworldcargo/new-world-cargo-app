import type { Address, DeliveryOption, Invoice, Recipient, Shipment, TrackingEvent } from "@/lib/domain";
import type { AddressDto, CustomerReferenceData, InvoiceDto, Money, RecipientDto, ShipmentDto } from "./contracts";

export function formatMoney(money: Money) {
  return new Intl.NumberFormat("en-ZM", { style: "currency", currency: money.currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(money.amountMinor / 100).replace("ZMW", "K");
}

export function shipmentToViewModel(dto: ShipmentDto): Shipment {
  return {
    id: dto.id,
    trackingNumber: dto.trackingNumber,
    carrier: dto.carrier,
    transportMode: dto.transportMode,
    packageName: dto.packageName,
    origin: dto.origin,
    destination: dto.destination,
    eta: dto.etaLabel,
    status: dto.status === "cancelled" ? "failed" : dto.status,
    statusLabel: dto.statusLabel,
    price: formatMoney(dto.price),
    image: dto.imageUrl,
    progress: dto.progress,
    nextAction: dto.nextAction,
    revision: dto.revision,
    allowedActions: dto.allowedActions,
    events: dto.events.map<TrackingEvent>((event) => ({ label: event.label, detail: event.detail, time: event.displayTime, complete: event.complete, current: event.current })),
  };
}

export function invoiceToViewModel(dto: InvoiceDto): Invoice {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    shipmentId: dto.shipmentId ?? undefined,
    shipmentLabel: dto.shipmentLabel,
    route: dto.route,
    issuedAt: dto.issuedAtLabel,
    dueAt: dto.dueAtLabel,
    status: dto.status === "paid" ? "paid" : "unpaid",
    amount: formatMoney(dto.total),
    amountValue: dto.total.amountMinor / 100,
    currency: dto.total.currency,
    lineItems: dto.lineItems.map((item) => ({ label: item.label, detail: item.detail, amount: formatMoney(item.amount) })),
    paymentMethod: dto.paymentMethod,
    paidAt: dto.paidAtLabel,
  };
}

export function addressToViewModel(dto: AddressDto): Address {
  return { id: dto.id, label: dto.label, line: dto.line, landmark: dto.landmark, default: dto.isDefault, revision: dto.revision };
}

export function recipientToViewModel(dto: RecipientDto): Recipient {
  const initials = dto.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NW";
  return { id: dto.id, name: dto.name, location: dto.address, phone: dto.phone, initials, revision: dto.revision };
}

export function referenceDataToViewModel(data: CustomerReferenceData) {
  return {
    pickupOfficeSuggestions: data.offices,
    deliveryOptions: data.deliveryOptions.map<DeliveryOption>((option) => ({ ...option, price: formatMoney(option.price) })),
    cargoTransportOptions: data.transportOptions,
  };
}
