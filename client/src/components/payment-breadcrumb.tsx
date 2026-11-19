import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { paymentsPath, suppliersPath } from "@/lib/payment-routes";

export function PaymentBreadcrumb({ current, supplierChild = false }: { current: string; supplierChild?: boolean }) {
  return <nav aria-label="Payment breadcrumbs" className="mb-3 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-ink/75">
    <Link href={paymentsPath} className="inline-flex min-h-9 items-center rounded-sm hover:underline">Payments</Link>
    <ChevronRight className="size-3.5" aria-hidden="true" />
    {supplierChild && <>
      <Link href={suppliersPath} className="inline-flex min-h-9 items-center rounded-sm hover:underline">Supplier Payments</Link>
      <ChevronRight className="size-3.5" aria-hidden="true" />
    </>}
    <span aria-current="page" className="font-semibold">{current}</span>
  </nav>;
}
