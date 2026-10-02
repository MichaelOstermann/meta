/** The metadata a call receives. */
export interface Meta {
    /** Callbacks that are called and removed when the module is replaced, only available with `hmr`. */
    readonly hmr?: Set<() => void>
    readonly line: number
    readonly name: string
    readonly path: string
}

export interface MetaParam {
    /**
     * The function that receives the metadata, as exported by the module:
     * `"signal"`, `"Foo.bar"` for `Foo.bar()`, `"default.bar"` for members of the default export.
     */
    function: string
    /** The module the function is imported from. */
    module: string
    /** The position of the argument, starting at `1`. Missing arguments in between are filled with `undefined`. */
    position: number
}

export interface MetaOptions {
    /**
     * Whether to add `Meta.hmr`.
     * @default false
     */
    hmr?: boolean
    /**
     * The functions that receive metadata:
     *
     * ```ts
     * // signal(0) → signal(0, meta)
     * { module: "signals", function: "signal", position: 2 }
     * ```
     */
    params: MetaParam[]
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
