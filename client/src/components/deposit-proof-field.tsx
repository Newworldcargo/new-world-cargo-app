import { FileCheck2, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { secondaryPaymentAction } from "@/lib/payment-presentation";
import { depositProofAccept, depositProofFileError } from "@/lib/deposit-proof";

export function DepositProofField({ file, onChange, disabled, optional }: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  optional?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  return <div className="rounded-xl border border-[#d5e2eb] bg-[#f3f7fa] p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">Deposit receipt {optional && <span className="font-normal text-ink/65">(optional)</span>}</h3>
        <p className="mt-1 text-xs text-ink/75">PDF, JPG, PNG or WebP, up to 3 MB.</p>
      </div>
      <input ref={input} type="file" hidden aria-label="Deposit receipt file" accept={depositProofAccept} disabled={disabled} onChange={event => {
        const selected = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!selected) return;
        const message = depositProofFileError(selected);
        setError(message);
        if (!message) onChange(selected);
      }} />
      <button type="button" disabled={disabled} className={secondaryPaymentAction + " min-h-11 bg-white"} onClick={() => input.current?.click()}>
        <Paperclip className="size-4" aria-hidden="true" />{file ? "Replace receipt" : "Attach receipt"}
      </button>
    </div>
    {file && <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-ink/10 pt-2">
      <p className="flex min-w-0 items-center gap-2 break-all text-sm font-medium"><FileCheck2 className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />{file.name}</p>
      <button type="button" disabled={disabled} className="min-h-10 text-sm font-semibold underline underline-offset-2 disabled:opacity-45" onClick={() => { setError(""); onChange(null); }}>Remove receipt</button>
    </div>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
