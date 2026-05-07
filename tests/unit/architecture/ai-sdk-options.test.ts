import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SOURCE_DIRS = ['actions', 'app', 'application', 'infrastructure', 'lib']
const FORBIDDEN_AI_SDK_OPTION = 'max' + 'Tokens'
const GENERATED_DIRS = new Set(['node_modules', '.next', '.git'])

function collectSourceFiles(dir: string): string[] {
    const entries = readdirSync(dir)
    const files: string[] = []

    for (const entry of entries) {
        if (GENERATED_DIRS.has(entry)) continue

        const path = join(dir, entry)
        const stats = statSync(path)

        if (stats.isDirectory()) {
            files.push(...collectSourceFiles(path))
            continue
        }

        if (/\.(ts|tsx)$/.test(entry)) {
            files.push(path)
        }
    }

    return files
}

describe('AI SDK call options', () => {
    it('does not use the removed maxTokens option in source files', () => {
        const offenders = SOURCE_DIRS
            .flatMap(collectSourceFiles)
            .filter((file) => readFileSync(file, 'utf8').includes(FORBIDDEN_AI_SDK_OPTION))
            .map((file) => relative(process.cwd(), file))

        expect(offenders).toEqual([])
    })
})
