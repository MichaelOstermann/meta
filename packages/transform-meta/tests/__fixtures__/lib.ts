export function foo(value?: unknown, meta?: { line: number, name: string, path: string }): unknown {
    return meta ?? value
}
