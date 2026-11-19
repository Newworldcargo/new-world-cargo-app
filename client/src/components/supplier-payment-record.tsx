import { CheckCircle2, Clock3 } from "lucide-react";
import type { SupplierPaymentMethod } from "@/lib/supplier-payment-draft";

export type SupplierPaymentRecord = {
  reference: string;
  supplierName: string;
  route: string;
  currency: string;
  amount: string;
  receivingCurrency?: string;
  createdAt?: string;
  paymentMethod?: SupplierPaymentMethod | null;
  invoiceReference?: string | null;
  supplierEmail?: string | null;
  status: "under_review" | "pending_confirmation" | "paid";
};

export const supplierMethodLabels: Record<SupplierPaymentMethod, string> = {
  office_cash: "Cash deposit at an office",
  atm_deposit: "ATM or bank deposit",
  card: "Debit or credit card",
  mobile_money: "Mobile money",
};

const statuses = {
  under_review: { label: "Under review", style: "bg-amber-50 text-amber-900" },
  pending_confirmation: { label: "Pending confirmation", style: "bg-sky-50 text-sky-900" },
  paid: { label: "Paid", style: "bg-emerald-50 text-emerald-900" },
};

export function StatusBadge({ status }: { status: SupplierPaymentRecord["status"] }) {
  const display = statuses[status];
  if (!display) return null;
  const Icon = status === "paid" ? CheckCircle2 : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${display.style}`}>
    <Icon className="size-3.5 shrink-0" aria-hidden="true" />{display.label}
  </span>;
}
