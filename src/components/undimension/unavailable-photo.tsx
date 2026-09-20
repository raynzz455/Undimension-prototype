"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UnavailablePhoto — placeholder untuk member yang belum upload foto.
 * Shows a custom warning icon + "NO PHOTO" text.
 */
export function UnavailablePhoto({
  className,
  label = "NO PHOTO",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] border-2 border-[#ff8c00]/50",
        className
      )}
    >
      <AlertTriangle className="w-8 h-8 text-[#ff8c00] mb-1" />
      <span className="font-mono-ud text-[10px] font-black text-[#ff8c00] tracking-widest">
        {label}
      </span>
    </div>
  );
}
