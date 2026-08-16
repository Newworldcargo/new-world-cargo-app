/**
 * New World Cargo brand lockup using a first-class public asset.
 *
 * The image lives in client/public so Vercel and other hosts serve it directly
 * without depending on the Manus storage proxy.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center ${compact ? "h-11" : "h-[58px]"}`}
      role="img"
      aria-label="New World Cargo"
    >
      <img
        src="/manus-storage/new-world-cargo-logo_7e9d1949.png"
        alt="New World Cargo"
        className={`block h-auto object-contain ${compact ? "w-[142px] max-w-full" : "w-[190px] max-w-full"}`}
      />
    </div>
  );
}
