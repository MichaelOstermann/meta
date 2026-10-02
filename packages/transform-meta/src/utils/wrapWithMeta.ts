import type { TransformMetaResolver } from "../types"

/** Wraps calls of the given functions imported from `from` with `withMeta`. */
export function wrapWithMeta(from: string, identifiers: string[]): TransformMetaResolver {
    return function (node, meta) {
        const name = meta.getImportedCallExpressionName(node, from)
        if (!identifiers.includes(name)) return
        const id = meta.injectMetaRecord({
            line: meta.getMetaLine(node),
            name: meta.getMetaName(node),
            path: meta.getMetaPath(),
        })
        meta.injectMetaWrapper(node, id)
    }
}
