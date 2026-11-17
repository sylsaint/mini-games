import { clsx, type ClassValue } from 'clsx';
export function cn(...values: ClassValue[]) { return clsx(values); }
export type WithElementRef<T, E = HTMLElement> = T & { ref?: E | null };
