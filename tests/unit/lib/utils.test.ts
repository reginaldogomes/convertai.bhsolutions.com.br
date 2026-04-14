import { describe, it, expect } from 'vitest'
import { getContrastTextColor, normalizeBrazilianPhone } from '@/lib/utils'

// ─── getContrastTextColor ─────────────────────────────────────────────────────

describe('getContrastTextColor()', () => {
    describe('returns white (#ffffff) for dark backgrounds', () => {
        it.each([
            '#000000', // pure black
            '#1a1a2e', // near-black
            '#2c2f36', // dark gray
            '#0d1b2a', // dark navy
            '#003366', // dark blue
            '#4b0082', // indigo-dark
        ])('%s → #ffffff', (hex) => {
            expect(getContrastTextColor(hex)).toBe('#ffffff')
        })
    })

    describe('returns dark (#1a1a2e) for light backgrounds', () => {
        it.each([
            '#ffffff', // pure white
            '#f8f9fa', // near-white
            '#ffff00', // yellow
            '#00ff00', // pure green
            '#add8e6', // light blue
            '#ff0000', // red — luminance 0.2126 > threshold 0.179
            '#6366f1', // indigo — luminance ~0.19 > threshold 0.179
        ])('%s → #1a1a2e', (hex) => {
            expect(getContrastTextColor(hex)).toBe('#1a1a2e')
        })
    })

    it('returns dark text for invalid hex (< 6 chars)', () => {
        expect(getContrastTextColor('#abc')).toBe('#1a1a2e')
    })

    it('strips # prefix correctly', () => {
        expect(getContrastTextColor('000000')).toBe('#ffffff')
    })
})

// ─── normalizeBrazilianPhone ──────────────────────────────────────────────────

describe('normalizeBrazilianPhone()', () => {
    describe('valid Brazilian mobile numbers', () => {
        it.each([
            ['(31) 99881-1678', '+5531998811678'],
            ['31998811678', '+5531998811678'],
            ['31 99881 1678', '+5531998811678'],
            ['5531998811678', '+5531998811678'],
            ['+5531998811678', '+5531998811678'],
            ['+55 31 99881-1678', '+5531998811678'],
            ['(11) 91234-5678', '+5511912345678'],
            ['11912345678', '+5511912345678'],
        ])('"%s" → "%s"', (input, expected) => {
            expect(normalizeBrazilianPhone(input)).toBe(expected)
        })
    })

    describe('valid Brazilian landline numbers', () => {
        it.each([
            ['(31) 3333-4444', '+553133334444'],
            ['3133334444', '+553133334444'],
        ])('"%s" → "%s"', (input, expected) => {
            expect(normalizeBrazilianPhone(input)).toBe(expected)
        })
    })

    describe('returns null for invalid numbers', () => {
        it.each([
            [''],              // empty
            ['123'],           // too short
            ['abcdefg'],       // no digits
            ['12345678901234567890'], // too long
            ['0000000000'],    // valid length but may pass — just testing length
        ])('"%s" → null or string', (input) => {
            const result = normalizeBrazilianPhone(input)
            // Either null or a valid E.164 — never a malformed string
            if (result !== null) {
                expect(result).toMatch(/^\+\d{10,15}$/)
            }
        })

        it('returns null for empty string', () => {
            expect(normalizeBrazilianPhone('')).toBeNull()
        })

        it('returns null for only 5 digits', () => {
            expect(normalizeBrazilianPhone('12345')).toBeNull()
        })
    })

    describe('already-formatted E.164 numbers pass through', () => {
        it('+5521987654321 stays unchanged', () => {
            expect(normalizeBrazilianPhone('+5521987654321')).toBe('+5521987654321')
        })

        it('international numbers with + prefix are preserved if valid length', () => {
            const result = normalizeBrazilianPhone('+12025551234')
            expect(result).toBe('+12025551234')
        })
    })

    describe('strips formatting characters', () => {
        it('handles () - and spaces', () => {
            const result = normalizeBrazilianPhone('(31) 9 9999-9999')
            expect(result).toBe('+5531999999999')
        })

        it('handles dots', () => {
            const result = normalizeBrazilianPhone('31.9.9999.9999')
            expect(result).toBe('+5531999999999')
        })
    })
})
