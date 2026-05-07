import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Next.js configuration compatibility', () => {
    it('uses next.config.js instead of unsupported next.config.ts', () => {
        const root = process.cwd()

        expect(existsSync(join(root, 'next.config.js'))).toBe(true)
        expect(existsSync(join(root, 'next.config.ts'))).toBe(false)
    })
})
