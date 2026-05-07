import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

describe('Next.js configuration compatibility', () => {
    it('uses next.config.js instead of unsupported next.config.ts', () => {
        const root = process.cwd()

        expect(existsSync(join(root, 'next.config.js'))).toBe(true)
        expect(existsSync(join(root, 'next.config.ts'))).toBe(false)
    })

    it('keeps the preflight guard passing before dev/build scripts run', () => {
        execFileSync(process.execPath, ['scripts/assert-next-config.mjs'], {
            cwd: process.cwd(),
            stdio: 'pipe',
        })
    })

    it('runs the config preflight inline in package.json scripts', () => {
        const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
            scripts: Record<string, string>
        }

        expect(packageJson.scripts.dev).toContain('node scripts/assert-next-config.mjs && next dev')
        expect(packageJson.scripts.build).toContain('node scripts/assert-next-config.mjs && next build')
    })
})
