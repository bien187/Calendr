"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** footer pinned to bottom (e.g. action buttons) */
  footer?: React.ReactNode;
}

/**
 * Responsive container:
 *  - mobile: slides up from the bottom (bottom sheet)
 *  - desktop (md+): docks as a right-side panel
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex w-full flex-col bg-surface shadow-2xl animate-sheet-up",
          "max-h-[92vh] rounded-t-2xl",
          "md:h-full md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-2xl md:animate-fade-in"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-elevated"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* mobile grab handle hint */}
        <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-border md:hidden" />

        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="border-t border-border px-5 py-3 pb-safe md:pb-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
