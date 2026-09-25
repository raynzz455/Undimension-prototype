import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract the hex color from a Tailwind arbitrary value class string.
 * Examples:
 *   "bg-[#ff4d4d]" → "#ff4d4d"
 *   "text-[#00e5ff]" → "#00e5ff"
 *   "#ff8c00" → "#ff8c00" (already a hex)
 *   "" → "#000000" (fallback)
 */
export function extractHex(input: string | undefined | null, fallback = "#000000"): string {
  if (!input) return fallback;
  const match = input.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : fallback;
}

/**
 * Calculate the relative luminance of a hex color using the standard
 * weighted RGB formula (ITU-R BT.601).
 * Returns a value 0-255 where 0 = darkest, 255 = lightest.
 *
 * Used to determine whether to use light or dark text on a colored background.
 */
export function getLuminance(hex: string): number {
  const clean = extractHex(hex, "#000000");
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  // ITU-R BT.601 luma formula — closer to human perception than simple average
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Returns true if the hex color is "dark" (luminance < 128).
 * Dark colors need light text on top for readability.
 * Light colors (luminance >= 128) need dark text.
 *
 * Threshold 128 is the standard midpoint — colors like pure red (#ff0000),
 * cyan (#00e5ff), magenta (#ff00ff) are above 128 → light text would be
 * hard to read → use dark text. Pure black, dark blue, dark purple are
 * below 128 → use light text.
 */
export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 128;
}

/**
 * Returns the appropriate text color for use ON TOP of the given hex background.
 * - Dark background → returns "#ffffff" (white text)
 * - Light background → returns "#000000" (black text)
 */
export function getContrastText(bgHex: string): string {
  return isDarkColor(bgHex) ? "#ffffff" : "#000000";
}
