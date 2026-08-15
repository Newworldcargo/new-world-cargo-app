/**
 * Design reminder: use the user-supplied yellow New World Cargo lockup at its
 * natural proportions, preserving the established white app canvas.
 */
const OFFICIAL_LOGO = "/manus-storage/new-world-cargo-supplied-yellow-logo_da10ee57.png";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center ${compact ? "h-11 w-[108px]" : "h-[58px] w-[156px]"}`}
      aria-label="New World Cargo"
    >
      <img
        src={OFFICIAL_LOGO}
        alt="New World Cargo"
        className={`h-auto object-contain ${compact ? "w-[104px]" : "w-[154px]"}`}
      />
    </div>
  );
}
