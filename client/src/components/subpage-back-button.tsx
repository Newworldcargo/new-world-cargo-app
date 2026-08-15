// New World Cargo navigation: use this Cargo Yellow control for every return action on a subpage.
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type SubpageBackButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function SubpageBackButton({ label, onClick, className }: SubpageBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-3.5 py-2.5 text-xs font-bold text-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}
