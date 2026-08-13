import { clsx, type ClassValue } from "clsx";

/**
 * No tailwind-merge here.
 *
 * On web, twMerge resolves conflicts by parsing class names. NativeWind resolves
 * them itself at build time using specificity, so twMerge is unnecessary weight
 * and can strip classes NativeWind understands but it does not.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
