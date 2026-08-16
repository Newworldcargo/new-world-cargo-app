export function mobileNavigationItemClass(active: boolean) {
  const base = "flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition duration-200";
  return `${base} ${active ? "bg-brand-secondary/80 text-cargo-yellow" : "!text-white hover:!text-white"}`;
}
