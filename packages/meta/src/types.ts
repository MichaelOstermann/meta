/** What `hmr` is at runtime: callbacks that are called and removed when the module is replaced. */
export type MetaHmr = Set<() => void>

/** Stands for the `MetaHmr` of the module, to be returned as part of a record. */
export type MetaHmrRef = symbol & { readonly hmr: true }

/** What is known about a call. */
export interface MetaInfo {
    /**
     * Return it to pass the `MetaHmr` of the module to the call.
     * It is left out of the record when the `hmr` option is disabled.
     */
    hmr: MetaHmrRef
    /** The line of the call. */
    line: number
    /** Taken from what the result of the call is assigned to, empty if there is nothing. */
    name: string
    /** The path of the module, relative to `process.cwd()`. */
    path: string
}

export type MetaRecord = Record<string, boolean | MetaHmrRef | number | string | null>

export interface MetaParam {
    /**
     * The function that receives the metadata, as exported by the module:
     * `"signal"`, `"Foo.bar"` for `Foo.bar()`, `"default.bar"` for members of the default export.
     * Without a module, the name it is called by.
     */
    function: string
    /**
     * What the call receives, a record of plain values:
     *
     * ```ts
     * // signal(0) → signal(0, { path: "src/app.ts", line: 3, name: "count" })
     * meta: ({ path, line, name }) => ({ path, line, name })
     * // effect(fn) → effect(fn, { hmr: hmr })
     * meta: ({ hmr }) => ({ hmr })
     * ```
     *
     * A call that would receive nothing is left alone.
     */
    meta: (info: MetaInfo) => MetaRecord
    /**
     * The module the function is imported from.
     * Without it, everything that is called by that name is matched, wherever it comes from.
     */
    module?: string
    /** The position of the argument, starting at `1`. Missing arguments in between are filled with `undefined`. */
    position: number
}

export interface MetaOptions {
    /**
     * Whether `hmr` is passed on to the calls whose record contains it.
     * @default false
     */
    hmr?: boolean
    /**
     * The functions that receive metadata:
     *
     * ```ts
     * // signal(0) → signal(0, { name: "count" })
     * { module: "signals", function: "signal", position: 2, meta: ({ name }) => ({ name }) }
     * ```
     */
    params: MetaParam[]
}

export interface MetaResult {
    code: string
    map: SourceMap
}

type SourceMap = import("magic-string").SourceMap
