import {
  ArrowLeft,
  ChevronRight,
  FileCheck2,
  FileText,
  LockKeyhole,
  Mail,
  PackageCheck,
  RefreshCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";

export const policies = [
  { slug: "privacy", title: "Privacy Policy", detail: "How account, shipment, and payment information is handled.", icon: LockKeyhole },
  { slug: "terms", title: "Terms of Use", detail: "The rules for using New World Cargo services and the app.", icon: Scale },
  { slug: "shipping", title: "Shipping Policy", detail: "Service routes, handover points, estimates, and delivery expectations.", icon: PackageCheck },
  { slug: "returns", title: "Returns & Refunds", detail: "What happens when a service is cancelled, returned, or disputed.", icon: RefreshCcw },
  { slug: "payments", title: "Payment Terms", detail: "Invoices, deposits, payment methods, and outstanding balances.", icon: FileCheck2 },
  { slug: "acceptable-use", title: "Customer Responsibilities", detail: "Accurate shipment details, lawful cargo, and account safety.", icon: ShieldCheck },
] as const;

export const legalPolicySlugs = policies.map((policy) => policy.slug);
type PolicySlug = (typeof policies)[number]["slug"];

const content: Record<PolicySlug, { title: string; intro: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: "This page is a customer-facing draft for review by New World Cargo management and legal counsel before publication.",
    sections: [
      { heading: "Information we collect", body: "We may collect account details, contact information, pickup and delivery addresses, shipment descriptions, tracking activity, uploaded documents, and payment status so we can arrange and support cargo services." },
      { heading: "How information is used", body: "Information may be used to create bookings, coordinate collection and delivery, send shipment updates, process payments, prevent misuse, resolve support requests, and meet applicable record-keeping obligations." },
      { heading: "Sharing and service providers", body: "Information may be shared with the offices, carriers, couriers, payment providers, technology providers, and other service partners needed to deliver a requested service. Access should be limited to the information required for that purpose." },
      { heading: "Your choices", body: "Customers should be able to request access, correction, or deletion of personal information where applicable, and manage optional notifications from Settings. The final publication should include the official privacy contact and response process." },
    ],
  },
  terms: {
    title: "Terms of Use",
    intro: "These draft terms describe the expected relationship between New World Cargo and customers using the app or requesting cargo services.",
    sections: [
      { heading: "Using the service", body: "Customers are responsible for providing complete and accurate shipment, recipient, pickup, delivery, and document information. A booking is subject to confirmation by New World Cargo and the availability of the selected service." },
      { heading: "Quotes and estimates", body: "Displayed prices, routes, and delivery times may be estimates until shipment details are reviewed and the booking is confirmed. Additional charges may apply when the shipment, address, weight, dimensions, duties, storage, or delivery requirements differ from the submitted information." },
      { heading: "Account security", body: "Customers must keep sign-in details and verified contact information secure, notify support of suspected unauthorized access, and use the account only for lawful activity." },
      { heading: "Changes and termination", body: "New World Cargo may update service terms, suspend access where necessary, or change service availability. The final terms should specify notice requirements, governing law, and the official dispute process." },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    intro: "This draft explains the main customer expectations for local and international cargo movements.",
    sections: [
      { heading: "Collection and handover", body: "Customers may select an available New World Cargo office or an approved collection arrangement. A shipment becomes trackable after it is received, identified, and registered by the relevant office or service partner." },
      { heading: "Air and sea services", body: "Air and sea cargo may have different routes, cut-off times, estimates, and handling requirements. Any displayed delivery estimate is a guide and may change because of customs, carrier schedules, weather, operational constraints, or incomplete information." },
      { heading: "Local delivery", body: "Customers may choose office collection or request delivery to an address where the service is available. Home delivery may carry an additional fee, which should be confirmed before dispatch." },
      { heading: "Delays and storage", body: "Customers should be notified when a shipment is delayed, held for information, awaiting payment, or ready for collection. The final policy should state any storage period and applicable storage charges." },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    intro: "This draft provides a clear place for customers to understand cancellation, return, and refund handling before final legal approval.",
    sections: [
      { heading: "Requesting a change or cancellation", body: "Customers should contact support as soon as possible with the booking or tracking number. Whether a booking can be changed or cancelled may depend on its current stage, carrier commitments, customs status, and costs already incurred." },
      { heading: "Refund assessment", body: "Refunds may require a review of the service purchased, payments received, third-party costs, currency conversion, and any non-refundable charges. The final policy should define the approved timelines and refund method." },
      { heading: "Damaged or missing cargo", body: "Customers should report visible damage, shortage, or loss promptly and provide the requested evidence, such as photographs, delivery records, or supporting documents. Claims are reviewed under the applicable service and carrier terms." },
      { heading: "Non-returnable situations", body: "Certain services, completed deliveries, customs charges, duties, third-party fees, or prohibited cargo may not be eligible for a refund. The final policy should list these situations clearly." },
    ],
  },
  payments: {
    title: "Payment Terms",
    intro: "This draft covers the payment information customers see around invoices, booking deposits, and delivery charges.",
    sections: [
      { heading: "Invoices and deposits", body: "A booking may require a deposit or payment before the shipment proceeds. Invoices show the amount due, payment status, and any available receipt after successful payment." },
      { heading: "Payment methods", body: "The app may support approved mobile-money and card payment methods. Customers should confirm that payment details are accurate and should not share one-time codes or passwords with another person." },
      { heading: "Additional charges", body: "Charges may be added or revised when shipment details, destination services, home delivery, customs requirements, storage, or carrier charges change. Customers should receive an explanation before an amount is collected where practicable." },
      { heading: "Payment support", body: "Payment disputes, duplicate charges, and failed transactions should be reported through the official support channel with the invoice or transaction reference available." },
    ],
  },
  "acceptable-use": {
    title: "Customer Responsibilities",
    intro: "Customers help keep cargo services safe and reliable by submitting accurate information and using the service lawfully.",
    sections: [
      { heading: "Accurate declarations", body: "Customers must describe cargo accurately, provide correct sender and recipient details, disclose relevant documents, and promptly update information that changes during the shipment." },
      { heading: "Prohibited or restricted cargo", body: "Customers must not submit unlawful, dangerous, counterfeit, stolen, or otherwise restricted cargo. The final policy should link to the approved prohibited-items list and any route-specific restrictions." },
      { heading: "Respectful service use", body: "Customers must not misuse the app, interfere with tracking or payment systems, impersonate another person, submit fraudulent documents, or use the service to harm another person or organization." },
      { heading: "Contact and escalation", body: "Questions, complaints, and urgent shipment concerns should be raised through the official support channel. The final published version should include verified contact details and escalation timelines." },
    ],
  },
};

function PolicyIcon({ slug }: { slug: PolicySlug }) {
  const Icon = policies.find((policy) => policy.slug === slug)?.icon ?? FileText;
  return <Icon className="size-5" />;
}

export default function Legal() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/settings/legal/:policy");
  const selected = params?.policy as PolicySlug | undefined;
  const policy = selected && selected in content ? content[selected] : undefined;

  if (policy && selected) {
    return <div className="mx-auto max-w-3xl text-ink">
      <button onClick={() => navigate("/settings/legal")} className="flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-ink"><ArrowLeft className="size-4" /> Back to legal</button>
      <div className="mt-7 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cargo-yellow/20 text-ink"><PolicyIcon slug={selected} /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Legal information</p><h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">{policy.title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">{policy.intro}</p></div></div>
      <div className="mt-6 rounded-2xl border border-cargo-yellow/30 bg-cargo-yellow/10 px-4 py-3 text-xs leading-5 text-ink/70"><strong className="text-ink">Draft for review.</strong> Replace this content with the approved company policy, effective date, jurisdiction, and official contact details before publishing.</div>
      <div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl border border-ink/10 bg-white p-4 text-xs sm:grid-cols-3"><div><p className="font-bold text-ink/45">Status</p><p className="mt-1 font-bold text-ink">Draft</p></div><div><p className="font-bold text-ink/45">Version</p><p className="mt-1 font-bold text-ink">0.1 · Review copy</p></div><div><p className="font-bold text-ink/45">Effective date</p><p className="mt-1 font-bold text-ink">Pending approval</p></div></div>
      <article className="mt-6 overflow-hidden rounded-[26px] border border-ink/10 bg-white">{policy.sections.map((section, index) => <section key={section.heading} className={`p-5 sm:p-6 ${index ? "border-t border-ink/8" : ""}`}><h2 className="font-heading text-lg font-extrabold">{section.heading}</h2><p className="mt-2 text-sm leading-7 text-ink/65">{section.body}</p></section>)}<div className="border-t border-ink/8 bg-[#f7f8fb] p-5 sm:p-6"><div className="flex items-start gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-cargo-yellow" /><p className="text-xs leading-5 text-ink/60">Questions about this policy? Add the approved New World Cargo legal or support contact here before launch.</p></div></div></article>
    </div>;
  }

  return <div className="mx-auto max-w-3xl text-ink">
    <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-ink"><ArrowLeft className="size-4" /> Back to settings</button>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Settings</p><h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">Legal</h1><p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">Review the policies and customer responsibilities that support a clear, trustworthy cargo service.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-2xl bg-cargo-yellow/15 px-3 py-2 text-xs font-bold text-ink"><span className="size-2 rounded-full bg-cargo-yellow" /> Review before launch</span></div>
    <div className="relative mt-6 overflow-hidden rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-5"><div className="absolute -bottom-7 right-8 size-16 rounded-2xl border-[10px] border-cargo-yellow/25" /><div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow text-ink"><FileText className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">Customer information rail</p><p className="mt-1 text-sm font-extrabold">Privacy <span className="text-ink/35">·</span> service terms <span className="text-ink/35">·</span> payments <span className="text-ink/35">·</span> support</p></div></div></div>
    <div className="mt-7 overflow-hidden rounded-[26px] border border-ink/10 bg-white">{policies.map((item, index) => { const Icon = item.icon; return <button key={item.slug} onClick={() => navigate(`/settings/legal/${item.slug}`)} className={`flex w-full items-center gap-3.5 px-4 py-4 text-left transition hover:bg-ink/[0.025] sm:px-5 ${index ? "border-t border-ink/8" : ""}`}><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cargo-yellow/15 text-ink"><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs leading-5 text-ink/50">{item.detail}</span></span><ChevronRight className="size-4 shrink-0 text-ink/35" /></button>; })}</div>
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4"><Mail className="mt-0.5 size-4 shrink-0 text-cargo-yellow" /><p className="text-xs leading-5 text-ink/55">Before publishing, add the official support and legal contact details, policy effective dates, and the jurisdiction approved for New World Cargo.</p></div>
  </div>;
}
