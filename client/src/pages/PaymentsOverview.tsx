import { ArrowRight, Globe2, ReceiptText } from "lucide-react";
import { Link } from "wouter";
import { invoicesPath, suppliersPath } from "@/lib/payment-routes";
import { paymentPageClass, paymentSurfaceClass, primaryPaymentAction, secondaryPaymentAction } from "@/lib/payment-presentation";

const destinations = [
  {
    title: "Invoices",
    description: "View cargo invoices, pay outstanding amounts, and download receipts.",
    action: "Open invoices",
    href: invoicesPath,
    icon: ReceiptText,
    surface: "",
    iconStyle: "bg-[#e7f0f7]",
    actionStyle: secondaryPaymentAction + " group-hover:border-[#a9bfce] group-hover:bg-[#e5eef5]",
  },
  {
    title: "Supplier Payments",
    description: "Request quotes and track payments to suppliers in China and Dubai.",
    action: "Open supplier payments",
    href: suppliersPath,
    icon: Globe2,
    surface: "bg-[radial-gradient(ellipse_at_top_right,#fcf2d7,transparent_65%)]",
    iconStyle: "bg-[#fff0cc]",
    actionStyle: primaryPaymentAction + " group-hover:border-[#17435d] group-hover:bg-[#17435d]",
  },
] as const;

export default function PaymentsOverview() {
  return <div data-payments-page className={paymentPageClass}>
    <header>
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">Payments</h1>
      <p className="mt-2 text-sm text-ink/75 sm:text-base">Manage your invoices and international supplier payments.</p>
    </header>
    <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
      {destinations.map(({ title, description, action, href, icon: Icon, surface, iconStyle, actionStyle }) =>
        <Link key={href} href={href} className={`group flex flex-col items-start ${paymentSurfaceClass} ${surface} p-4 transition-colors hover:border-[#a9bfce] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#012642] sm:p-7`}>
          <span className={`grid size-10 place-items-center rounded-xl sm:size-12 border border-ink/5 ${iconStyle}`}><Icon className="size-5" aria-hidden="true" /></span>
          <h2 className="mt-3 text-xl font-bold sm:mt-4 sm:text-2xl">{title}</h2>
          <p className="mt-2 max-w-sm flex-1 text-sm text-ink/75">{description}</p>
          <span className={`mt-4 sm:mt-5 ${actionStyle}`}>
            {action}<ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </span>
        </Link>
      )}
    </div>
  </div>;
}
