import { cn } from "@/lib/utils";
import { Fragment } from "react";

export function StarGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M50 0 L58 42 L100 50 L58 58 L50 100 L42 58 L0 50 L42 42 Z" />
    </svg>
  );
}

/**
 * BioText — renders text with simple markdown:
 *   **bold** → <strong>bold</strong>
 *   *italic* → <em>italic</em>
 * Plain text passes through unchanged.
 *
 * Renders a <span> (not <p>) so it can be used inline inside other
 * block elements without creating nested <p> tags (invalid HTML).
 * For standalone block usage, wrap in a <p> or <div>.
 *
 * Usage: <p><BioText>{member.bio}</BioText></p>
 */
export function BioText({ children, className }: { children: string; className?: string }) {
  if (!children) return null;
  const parts = children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}

export function Marquee({
  text,
  className,
  repeat = 8,
}: {
  text: string;
  className?: string;
  repeat?: number;
}) {
  return (
    <div className={cn("animate-marquee font-bebas tracking-widest uppercase", className)}>
      {Array.from({ length: repeat }).map((_, i) => (
        <span key={i} className="px-4 whitespace-nowrap">
          {text}
        </span>
      ))}
    </div>
  );
}
