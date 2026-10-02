/** The metadata a call receives. */
export interface Meta {
    /** Callbacks that are called and removed when the module is replaced, only available with `hmr`. */
    readonly hmr?: Set<() => void>
    readonly line: number
    readonly name: string
    readonly path: string
}

export interface MetaOptions {
    /**
     * Whether to add `Meta.hmr`.
     * @default false
     */
    hmr?: boolean
    /**
     * The functions that receive metadata, by the module they are imported from,
     * and the position of the argument, starting at `1`:
     *
     * ```ts
     * // signal(0) → signal(0, meta)
     * // effect(fn) → effect(fn, undefined, meta)
     * { signals: { signal: 2, effect: 3 } }
     * ```
     *
     * Names are relative to the module: `"signal"`, `"Foo.bar"` for `Foo.bar()`, `"default.bar"` for members of the default export.
     */
    params: Record<string, Record<string, number>>
    /** Changes the name of a record, which is taken from what the result of the call is assigned to. */
    getName?: (name: string) => string
    /** Changes the path of a module, which is relative to `process.cwd()`. */
    getPath?: (path: string) => string
}

export interface MetaResult {
    code: string
    map: SourceMap
}

type SourceMap = import("magic-string").SourceMap
