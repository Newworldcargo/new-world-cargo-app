import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck2,
  Share2,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/api/http";
import { useCustomerShipment } from "@/api/hooks";
import { Button } from "@/components/ui/button";

type ProofOfDeliveryRecord = {
  shipmentId: string;
  recipientName: string | null;
  occurredAt: string | null;
  method: string | null;
  evidenceUrl: string | null;
};

function formatOccurredAt(value: string | null) {
  if (!value) return "Delivery time was not recorded.";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" });
}

export default function ProofOfDelivery() {
  const [, params] = useRoute("/shipments/:id/proof");
  const [, navigate] = useLocation();
  const shipmentQuery = useCustomerShipment(params?.id);
  const shipment = shipmentQuery.data;
  const proofQuery = useQuery({
    queryKey: ["customer", "shipment", shipment?.id, "proof-of-delivery"],
    queryFn: () =>
      apiRequest<ProofOfDeliveryRecord | null>(
        `/shipments/${encodeURIComponent(shipment!.id)}/proof-of-delivery`
      ),
    enabled: Boolean(shipment?.id) && shipment?.status === "delivered",
  });

  if (shipmentQuery.isLoading)
    return (
      <div className="mx-auto max-w-xl py-14 text-center text-sm text-ink/55">
        Loading proof of delivery…
      </div>
    );
  if (shipmentQuery.isError || !shipment)
    return (
      <div className="mx-auto max-w-xl text-center text-ink">
        <FileCheck2 className="mx-auto size-10 text-cargo-yellow" />
        <h1 className="mt-4 font-heading text-2xl font-extrabold">
          Proof of delivery unavailable
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          We could not find this shipment in your account. Return to your
          shipment list and try again.
        </p>
        <Button
          onClick={() => navigate("/shipments")}
          className="mt-6 rounded-xl bg-cargo-yellow font-bold text-ink"
        >
          View shipments
        </Button>
      </div>
    );

  const proof = proofQuery.data;
  return (
    <div className="mx-auto max-w-2xl text-ink">
      <button
        onClick={() => navigate(`/shipments/${shipment.id}`)}
        className="flex items-center gap-2 text-sm font-bold text-ink/55"
      >
        <ArrowLeft className="size-4" /> Back to shipment
      </button>
      <div className="mt-7 rounded-[28px] border border-ink/10 bg-white p-6 shadow-sm">
        <span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow">
          <FileCheck2 className="size-5" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">
          Proof of delivery
        </p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">
          {shipment.trackingNumber}
        </h1>
        {shipment.status !== "delivered" ? (
          <div className="mt-6 rounded-2xl bg-cargo-yellow/15 p-5 text-sm">
            <p className="font-bold">
              Proof of delivery will appear after delivery.
            </p>
            <p className="mt-1 text-ink/60">
              This page only shows the delivery record after New World Cargo has
              completed the shipment.
            </p>
          </div>
        ) : proofQuery.isLoading ? (
          <p className="mt-6 text-sm text-ink/55">Loading delivery record…</p>
        ) : proofQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            We could not load the delivery record. Please try again.
          </div>
        ) : proof ? (
          <>
            <div className="mt-6 rounded-2xl bg-[#f7f8fb] p-5 text-sm">
              <div className="flex gap-3">
                <CheckCircle2 className="size-5 text-cargo-yellow" />
                <div>
                  <p className="font-bold">Delivered to recipient</p>
                  <p className="mt-1 text-ink/55">
                    {formatOccurredAt(proof.occurredAt)}
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold text-ink/45">Recipient</dt>
                  <dd className="mt-1 font-semibold">
                    {proof.recipientName || "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-ink/45">
                    Confirmation
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {proof.method === "recorded"
                      ? "Recorded by New World Cargo"
                      : "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-ink/45">
                    Signature / photo
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {proof.evidenceUrl
                      ? "Available"
                      : "No evidence was recorded"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {proof.evidenceUrl ? (
                <Button
                  onClick={() =>
                    window.open(
                      proof.evidenceUrl!,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  variant="outline"
                  className="rounded-xl font-bold"
                >
                  <Download className="mr-2 size-4" /> View evidence
                </Button>
              ) : null}
              <Button
                onClick={() =>
                  navigator.share?.({
                    title: "Proof of delivery",
                    text: shipment.trackingNumber,
                  })
                }
                variant="outline"
                className="rounded-xl font-bold"
              >
                <Share2 className="mr-2 size-4" /> Share
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#f7f8fb] p-5 text-sm">
            <p className="font-bold">No delivery record is available yet.</p>
            <p className="mt-1 text-ink/55">
              The shipment is marked delivered, but the confirmation details
              have not been recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
