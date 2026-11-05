import { clsx, type ClassValue } from "clsx";

/** Accepts Vue-compatible conditional classes without requiring Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
