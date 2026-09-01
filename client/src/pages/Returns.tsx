import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  useCustomerReturnRequests,
  useCustomerShipments,
  useReturnRequestMutation,
} from "@/api/hooks";
import { ErrorState, LoadingState } from "@/components/async-state";
import { Button } from "@/components/ui/button";

const steps = ["Eligibility", "Reason", "Handover", "Review"];

export default function Returns() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [handover, setHandover] = useState<"pickup" | "drop_off">("pickup");
  const shipmentsQuery = useCustomerShipments({ status: "delivered" });
  const returnsQuery = useCustomerReturnRequests();
  const createReturn = useReturnRequestMutation();
  const eligibleShipment = useMemo(
    () =>
      shipmentsQuery.data?.find(shipment => shipment.status === "delivered") ??
      null,
    [shipmentsQuery.data]
  );
  const submitted = createReturn.data;

  if (shipmentsQuery.isLoading)
    return <LoadingState label="Loading eligible shipments…" />;
  if (shipmentsQuery.isError)
    return (
      <ErrorState
        title="We could not load return eligibility"
        detail="Please try again."
        action={{ label: "Try again", onClick: () => shipmentsQuery.refetch() }}
      />
    );
  if (submitted)
    return (
      <div className="mx-auto max-w-xl text-center text-ink">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-cargo-yellow">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-extrabold">
          Return request received
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          Reference {submitted.id}. We will confirm the next scan and handover
          steps.
        </p>
        <Button
          type="button"
          onClick={() => navigate("/shipments")}
          className="mt-6 rounded-xl bg-cargo-yellow font-bold text-ink"
        >
          Track shipments
        </Button>
      </div>
    );

  const submit = () => {
    if (!eligibleShipment) return;
    createReturn.mutate({ shipmentId: eligibleShipment.id, reason, handover });
  };

  return (
    <div className="mx-auto max-w-2xl text-ink">
      <button
        type="button"
        onClick={() => (step ? setStep(step - 1) : navigate("/shipments"))}
        className="flex items-center gap-2 text-sm font-bold text-ink/55"
      >
        <ArrowLeft className="size-4" />{" "}
        {step ? "Previous step" : "Back to shipments"}
      </button>
      <div className="mt-7 flex items-start gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow">
          <RotateCcw className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">
            Returns
          </p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">
            Request a return
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            Review eligibility, choose a reason, and arrange handover.
          </p>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {steps.map((label, index) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full ${index <= step ? "bg-cargo-yellow" : "bg-ink/10"}`}
            />
            <p className="mt-2 hidden text-[10px] font-bold text-ink/50 sm:block">
              {label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-7">
        {step === 0 && (
          <>
            <h2 className="font-heading text-xl font-extrabold">
              Check eligibility
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/55">
              Returns are available for eligible shipments before final
              delivery. The team will confirm service availability and charges.
            </p>
            {eligibleShipment ? (
              <div className="mt-5 rounded-2xl bg-cargo-yellow/18 p-4 text-sm font-bold">
                {eligibleShipment.trackingNumber} is eligible for a return
                review.
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-ink/15 p-4 text-sm text-ink/60">
                There are no customer shipments currently eligible for a return
                request.
              </div>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="font-heading text-xl font-extrabold">
              Why do you need a return?
            </h2>
            <div className="mt-5 grid gap-2">
              {[
                "Incorrect item",
                "Damaged item",
                "Recipient no longer available",
                "Changed my mind",
                "Other",
              ].map(item => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setReason(item)}
                  className={`rounded-xl border p-3 text-left text-sm font-bold ${reason === item ? "border-cargo-yellow bg-cargo-yellow/15" : "border-ink/10"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-heading text-xl font-extrabold">
              Choose handover
            </h2>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => setHandover("pickup")}
                className={`rounded-xl border p-3 text-left text-sm font-bold ${handover === "pickup" ? "border-cargo-yellow bg-cargo-yellow/15" : "border-ink/10"}`}
              >
                Pickup from my address
              </button>
              <button
                type="button"
                onClick={() => setHandover("drop_off")}
                className={`rounded-xl border p-3 text-left text-sm font-bold ${handover === "drop_off" ? "border-cargo-yellow bg-cargo-yellow/15" : "border-ink/10"}`}
              >
                Drop off at a New World Cargo office
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-heading text-xl font-extrabold">
              Review return request
            </h2>
            <div className="mt-5 space-y-3 rounded-2xl bg-[#f7f8fb] p-4 text-sm">
              <p>
                <b>Shipment:</b>{" "}
                {eligibleShipment?.trackingNumber ?? "Unavailable"}
              </p>
              <p>
                <b>Reason:</b> {reason || "Not selected"}
              </p>
              <p>
                <b>Handover:</b>{" "}
                {handover === "pickup"
                  ? "Pickup from my address"
                  : "Drop off at a New World Cargo office"}
              </p>
              <p className="text-xs text-ink/55">
                A return charge may apply. We will confirm before collection or
                drop-off.
              </p>
            </div>
            {createReturn.isError && (
              <p className="mt-4 text-sm text-red-700">
                We could not submit the return request. Please try again.
              </p>
            )}
          </>
        )}
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            disabled={
              !eligibleShipment ||
              (step === 1 && !reason) ||
              createReturn.isPending
            }
            onClick={() => (step === 3 ? submit() : setStep(step + 1))}
            className="rounded-xl bg-cargo-yellow font-bold text-ink"
          >
            {step === 3
              ? createReturn.isPending
                ? "Submitting…"
                : "Submit return request"
              : "Continue"}
          </Button>
        </div>
      </div>
      {returnsQuery.data?.length ? (
        <p className="mt-4 text-xs text-ink/50">
          Latest return request: {returnsQuery.data[0].id} ·{" "}
          {returnsQuery.data[0].displayStatus}
        </p>
      ) : null}
    </div>
  );
}
