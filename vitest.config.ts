import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: [
                'domain/**',
                'application/use-cases/**',
                'lib/utils.ts',
                'actions/**',
            ],
            exclude: [
                'domain/entities/index.ts',
                'domain/interfaces/index.ts',
                'domain/errors/index.ts',
            ],
            thresholds: {
                statements: 70,
                branches: 65,
                functions: 70,
                lines: 70,
            },
        },
    },
})
