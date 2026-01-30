import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  try {
    // Filter out any undefined/null values before processing
    const filtered = inputs.filter(Boolean);
    return twMerge(clsx(filtered));
  } catch (error) {
    // Fallback: if tailwind-merge fails, just use clsx
    console.error('⚠️ Tailwind merge error, falling back to clsx:', error);
    return clsx(inputs.filter(Boolean));
  }
}