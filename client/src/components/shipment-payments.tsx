import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/http";
import type { Money } from "@/api/contracts";
import type { OnlineBooking } from "@/api/bookings";
import { PaymentModal } from "./payment-modal";

type PaymentSummary = {
  total: Money; paid: Money; remaining: Money; status: string; invoiceId: string | null;
  checkoutMessage: string | null;
  receipts: { id: string; number: string; amount: Money; dateLabel: string; method: string; refunded: boolean }[];
};
const money = (value: Money) => `${value.currency} ${(value.amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ShipmentPayments({ shipmentId, reference, cancelled, booking }: { shipmentId: string; reference: string; cancelled: boolean; booking?: OnlineBooking }) {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer", user?.id, "shipment-payments", shipmentId],
    queryFn: () => apiRequest<PaymentSummary>(`/shipments/${encodeURIComponent(shipmentId)}/payments`),
    enabled: Boolean(user) && !booking, refetchInterval: 30_000,
  });
  async function download(id: string) {
    if (downloading) return;
    setDownloading(id); setDownloadError("");
    try {
      const document = await apiRequest<{ filename: string; mimeType: string; content: string }>(`/shipments/${encodeURIComponent(shipmentId)}/receipts/${encodeURIComponent(id)}`);
      const url = URL.createObjectURL(new Blob([document.content], { type: document.mimeType }));
      const anchor = window.document.createElement("a");
      anchor.href = url; anchor.download = document.filename;
      window.document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch { setDownloadError("We couldn't download this receipt. Please try again."); }
    finally { setDownloading(null); }
  }
  return <section className="border-t border-ink/15 py-5 text-ink" aria-labelledby="shipment-payments-heading">
    <h2 id="shipment-payments-heading" className="text-lg font-bold">Payments & receipts</h2>
    {booking ? <div className="mt-3 space-y-3 text-sm">
      <p className="font-semibold">{booking.status === "cancelled" ? "Booking closed" : "Awaiting final bill"}</p>
      {booking.price.amountMinor > 0 && <dl><div className="flex flex-wrap justify-between gap-2"><dt>Booking estimate</dt><dd className="font-semibold">{money(booking.price)}</dd></div></dl>}
      <p>{booking.status === "cancelled" ? "This booking is not proceeding. Contact us if you have a payment query." : "Payment details will appear here once your shipment and bill are confirmed."}</p>
    </div> : isLoading ? <p className="mt-3 text-sm" role="status">Loading payments...</p> : isError || !data ? <div className="mt-3" role="alert"><p>We couldn't load payment details.</p><button className="mt-2 font-semibold underline" onClick={() => refetch()}>Try again</button></div> : <>
      <p className="mt-3 font-semibold">{data.status}</p>
      <dl className="mt-3 space-y-2 text-sm">
        {[["Total bill", data.total], ["Recorded payments", data.paid], ["Remaining balance", data.remaining]].map(([label, value]) => <div className="flex flex-wrap justify-between gap-2" key={label as string}><dt>{label as string}</dt><dd className="font-semibold">{money(value as Money)}</dd></div>)}
      </dl>
      {data.remaining.amountMinor > 0 && !cancelled && <button onClick={() => setShowPayment(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cargo-yellow px-5 py-3 font-bold text-ink"><CreditCard className="size-4" />Pay now</button>}
      {data.receipts.length ? <ul className="mt-5 divide-y divide-ink/10">{data.receipts.map(receipt => <li className="py-3" key={receipt.id}>
        <p className="break-words text-sm font-semibold">{receipt.number} · {money(receipt.amount)}</p>
        <p className="mt-1 text-xs text-ink/65">{receipt.dateLabel} · {receipt.method}{receipt.refunded ? " · Refunded" : ""}</p>
        <button onClick={() => download(receipt.id)} disabled={Boolean(downloading)} aria-label={`Download receipt ${receipt.number}`} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold disabled:opacity-50"><Download className="size-4" />{downloading === receipt.id ? "Downloading..." : "Download receipt"}</button>
      </li>)}</ul> : <p className="mt-4 text-sm text-ink/65">No payment receipts yet.</p>}
      {downloadError && <p className="mt-3 text-sm text-red-700" role="alert">{downloadError}</p>}
      <PaymentModal open={showPayment} invoiceId={data.invoiceId ?? undefined} amount={money(data.remaining)} reference={reference}
        unavailableMessage={data.checkoutMessage ?? undefined} onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); void refetch(); }} />
    </>}
  </section>;
}
