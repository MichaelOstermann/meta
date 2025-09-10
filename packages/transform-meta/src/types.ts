import type { Node } from "oxc-parser"
import type { Meta } from "./Meta"

export interface TransformMetaResolver {
    (node: Node, meta: Meta): void
}

export interface TransformMetaOptions {
    hmr?: boolean
    resolve: TransformMetaResolver | TransformMetaResolver[]
    getName?: (name: string, node: Node, meta: Meta) => string
    getPath?: (path: string, meta: Meta) => string
}
