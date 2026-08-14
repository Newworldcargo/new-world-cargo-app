// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

import { ASSETS } from "@/lib/mock-data";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="New World Cargo">
      <div className="relative grid size-10 place-items-center rounded-2xl bg-cargo-yellow shadow-[0_8px_20px_rgba(255,200,61,0.2)]">
        <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <div className="relative h-6 w-7">
            <span className="absolute left-0 top-1 h-1.5 w-5 -skew-y-12 rounded-sm bg-ink" />
            <span className="absolute left-1 top-2.5 h-1.5 w-6 -skew-y-12 rounded-sm bg-ink" />
            <span className="absolute left-0 top-4 h-1.5 w-5 -skew-y-12 rounded-sm bg-ink" />
            <span className="absolute left-2 top-5.5 h-1.5 w-5 -skew-y-12 rounded-sm bg-ink" />
          </div>
        </div>
        <img src={ASSETS.mark} alt="" className="relative z-10 size-7 object-contain opacity-70 mix-blend-multiply" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-heading text-sm font-extrabold tracking-[0.14em] text-white">NEW WORLD</div>
          <div className="mt-1 font-heading text-[10px] font-semibold tracking-[0.44em] text-cargo-yellow">CARGO</div>
        </div>
      )}
    </div>
  );
}
