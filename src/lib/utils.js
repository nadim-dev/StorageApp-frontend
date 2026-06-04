/**
 * Utility function to merge className strings
 * Combines Tailwind CSS classes and handles conditional classes
 */
export function cn(...classes) {
  return classes.flat().filter(Boolean).join(" ").trim();
}

/**
 * Alternative implementation using modern approach
 * If you have clsx installed, you can replace this with: import { clsx } from 'clsx'
 */
export default cn;
