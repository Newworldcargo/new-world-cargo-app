import { ArrowRight, Globe2, ReceiptText } from "lucide-react";
import { Link } from "wouter";
import { invoicesPath, suppliersPath } from "@/lib/payment-routes";

const destinations = [
  { title: "Invoices", description: "View cargo invoices, pay outstanding amounts, and download receipts.", action: "Open invoices", href: invoicesPath, icon: ReceiptText },
  { title: "Supplier Payments", description: "Request quotes and track international supplier transfers.", action: "Open payments", href: suppliersPath, icon: Globe2 },
] as const;

export default function PaymentsOverview() {
  return <div className="mx-auto max-w-5xl text-ink sm:px-4 sm:py-5">
    <h1 className="text-3xl font-bold sm:text-4xl">Payments</h1>
    <p className="mt-2 text-sm text-ink/70 sm:text-base">Manage your invoices and international supplier payments.</p>
    <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
      {destinations.map(({ title, description, action, href, icon: Icon }) => <Link key={href} href={href} className="group flex min-w-0 flex-col items-start rounded-[1.5rem] border border-ink/10 bg-white p-5 text-ink shadow-sm transition-colors hover:border-ink/35 hover:bg-[#f7fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-[#eaf2f8]"><Icon className="size-5" aria-hidden="true" /></span>
        <h2 className="mt-5 text-xl font-bold">{title}</h2>
        <p className="mt-2 flex-1 text-sm text-ink/70">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">{action}<ArrowRight className="size-4" aria-hidden="true" /></span>
      </Link>)}
    </div>
  </div>;
}
