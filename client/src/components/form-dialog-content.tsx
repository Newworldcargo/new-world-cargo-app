import type { ComponentProps } from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Consistent scroll-safe dialog surface for customer create and edit forms. */
export function FormDialogContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return <DialogContent {...props} className={cn("max-h-[90vh] overflow-y-auto rounded-[26px] sm:max-w-lg", className)} />;
}
