import type { Node } from "oxc-parser"
import type { MetaContext } from "./MetaContext"

/** The metadata a call receives. */
export interface Meta {
    /** Callbacks that are called and removed when the module is replaced, only available with `hmr`. */
    readonly hmr?: Set<() => void>
    readonly line: number
    readonly name: string
    readonly path: string
}

export interface TransformMetaResolver {
    (node: Node, meta: MetaContext): void
}

export interface TransformMetaOptions {
    hmr?: boolean
    resolve: TransformMetaResolver | TransformMetaResolver[]
    getName?: (name: string, node: Node, meta: MetaContext) => string
    getPath?: (path: string, meta: MetaContext) => string
}
