import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a WCAG-compliant text color for a given HEX background color.
 * Uses relative luminance to decide between white (#ffffff) and near-black (#1a1a2e).
 * Ensures a contrast ratio ≥ 4.5:1 for normal text (WCAG AA).
 */
export function getContrastTextColor(hex: string): '#ffffff' | '#1a1a2e' {
  const h = hex.replace(/^#/, '')
  if (h.length !== 6) return '#1a1a2e'
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  // Threshold: luminance > 0.179 → dark text, else → white text
  return L > 0.179 ? '#1a1a2e' : '#ffffff'
}

/**
 * Normalizes a Brazilian phone number to E.164 format (+55...).
 * Handles formats: (31) 99881-1678 · 31998811678 · 31 99881 1678 · +55 31 99881-1678
 * Returns null if the number cannot be normalized to a valid 10 or 11-digit BR number.
 */
export function normalizeBrazilianPhone(raw: string): string | null {
    // Strip everything except digits and a leading +
    const stripped = raw.replace(/[^\d+]/g, '')

    // Already E.164 with country code
    if (stripped.startsWith('+')) {
        const digits = stripped.slice(1)
        if (digits.length >= 10 && digits.length <= 15) return stripped
        return null
    }

    // Remove country code if already prefixed with 55
    const digits = stripped.startsWith('55') && stripped.length > 11
        ? stripped.slice(2)
        : stripped

    // Valid BR: 10 digits (landline with DDD) or 11 digits (mobile with 9 + DDD)
    if (digits.length < 10 || digits.length > 11) return null

    return `+55${digits}`
}
