export const paymentPageClass = "mx-auto w-full min-w-0 max-w-6xl text-ink";
export const paymentSurfaceClass = "min-w-0 rounded-3xl border border-[#dce6ee] bg-white";

const actionClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-[background-color,border-color,color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012642] focus-visible:ring-0 active:scale-[.98] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-45";

export const primaryPaymentAction = actionClass + " border-[#012642] bg-[#012642] text-[#fff]! hover:border-[#17435d] hover:bg-[#17435d] active:bg-[#001b30]";
export const secondaryPaymentAction = actionClass + " border-[#d5e2eb] bg-[#f2f6fa] text-ink hover:border-[#a9bfce] hover:bg-[#e5eef5] active:bg-[#dae8f1]";
export const paymentControlClass = "min-h-11 rounded-xl border border-[#d5e2eb] bg-white text-ink outline-none transition-colors hover:border-[#a9bfce] focus-visible:border-[#012642] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012642]";
