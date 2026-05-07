#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const tsConfig = join(root, 'next.config.ts')
const jsConfig = join(root, 'next.config.js')

if (existsSync(tsConfig)) {
  console.error([
    'Unsupported Next.js configuration detected: next.config.ts',
    'This project must use next.config.js so `next dev` and Vercel builds run on environments that do not load TypeScript config files.',
    'Rename next.config.ts to next.config.js and export the config with `module.exports`.',
  ].join('\n'))
  process.exit(1)
}

if (!existsSync(jsConfig)) {
  console.error('Missing Next.js configuration: expected next.config.js at the repository root.')
  process.exit(1)
}
