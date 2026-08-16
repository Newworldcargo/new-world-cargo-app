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
        src="/new-world-cargo-logo.png"
        alt="New World Cargo"
        className={`block w-auto object-contain ${compact ? "h-9 max-w-[142px]" : "h-12 max-w-[190px]"}`}
      />
    </div>
  );
}
