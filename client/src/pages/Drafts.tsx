import { ArrowLeft, FilePenLine, Play, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { useCustomerDrafts, useShipmentDraftMutations } from "@/api/hooks";

export default function Drafts() {
  const [, navigate] = useLocation();
  const draftsQuery = useCustomerDrafts();
  const draftMutations = useShipmentDraftMutations();
  const drafts = draftsQuery.data ?? [];

  if (draftsQuery.isLoading) return <LoadingState label="Loading shipment drafts…" />;
  if (draftsQuery.isError) return <ErrorState title="We could not load your drafts" detail="Please try again." action={{ label: "Try again", onClick: () => draftsQuery.refetch() }} />;

  return <div className="mx-auto max-w-3xl text-ink">
    <button onClick={() => navigate("/shipments")} className="flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"><ArrowLeft className="size-4" /> Back to shipments</button>
    <div className="mt-7 flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow text-ink"><FilePenLine className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">Shipment management</p><h1 className="mt-1 font-heading text-3xl font-extrabold">Shipment drafts</h1><p className="mt-2 text-sm text-ink/55">Resume a shipment request saved to your customer account.</p></div></div>
    {drafts.length ? <div className="mt-6 space-y-3">{drafts.map((draft) => <div key={draft.id} className="rounded-[26px] border border-ink/10 bg-white p-5"><p className="text-sm font-bold">{String((draft.payload.form as { recipient?: string } | undefined)?.recipient || "New cargo request")}</p><p className="mt-1 text-xs text-ink/55">{String((draft.payload.form as { pickup?: string } | undefined)?.pickup || "Pickup not selected")} · {String((draft.payload.transport || "air") === "sea" ? "Sea cargo" : "Air cargo")}</p><p className="mt-4 text-xs text-ink/45">Saved on the server. Operations must quote and confirm this request before it becomes a shipment.</p><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => navigate(`/send?draft=${encodeURIComponent(draft.id)}`)} className="rounded-xl bg-cargo-yellow font-bold text-ink"><Play className="mr-2 size-4" /> Resume request</Button><Button variant="outline" disabled={draftMutations.remove.isPending} onClick={() => draftMutations.remove.mutate({ id: draft.id, revision: draft.revision })} className="rounded-xl font-bold"><Trash2 className="mr-2 size-4" /> {draftMutations.remove.isPending ? "Deleting…" : "Delete request"}</Button></div></div>)}</div> : <div className="mt-6 rounded-[26px] border border-dashed border-ink/20 bg-[#f7f8fb] p-8 text-center"><EmptyState title="No saved requests" detail="Start a shipment and choose Save as Draft to keep it on your account." /><Button onClick={() => navigate("/send")} className="mt-5 rounded-xl bg-cargo-yellow font-bold text-ink">Start a shipment</Button></div>}
  </div>;
}
