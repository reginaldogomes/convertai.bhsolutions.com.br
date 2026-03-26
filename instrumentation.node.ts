// Intercept the known JSON.parse("") unhandled rejection from @supabase/auth-js.
// Supabase SSR encounters empty auth cookie values in internal async code paths.
// The error is harmless (pages render with 200) but pollutes server logs.
export {}

const emit = process.emit

// @ts-expect-error — patching process.emit with compatible overloaded signature
process.emit = function (event: string | symbol, ...args: unknown[]): boolean {
    if (event === 'unhandledRejection') {
        const reason = args[0]
        if (
            reason instanceof SyntaxError &&
            reason.message.includes('is not valid JSON')
        ) {
            return true
        }
    }
    // @ts-expect-error — forwarding to original emit
    return emit.call(process, event, ...args)
}
