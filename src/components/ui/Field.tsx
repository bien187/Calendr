"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-fg", className)}>
      {children}
    </label>
  );
}

const fieldBase =
  "w-full rounded-xl border border-border bg-bg px-3.5 text-sm text-fg placeholder:text-muted " +
  "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "py-2.5 min-h-[80px] resize-none", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, "h-11 appearance-none", className)} {...props} />
));
Select.displayName = "Select";
