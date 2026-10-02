import type { TransformMetaResolver } from "../types"

/** Passes the metadata as the nth argument (starting at `1`) to the given functions imported from `from`, unless that argument is already taken. */
export function setMetaParam(from: string, identifiers: Record<string, number>): TransformMetaResolver {
    return function (node, meta) {
        const name = meta.getImportedCallExpressionName(node, from)
        const pos = name ? identifiers[name] : undefined
        if (pos == null || !meta.canInjectMetaParam(node, pos)) return
        const id = meta.injectMetaRecord({
            line: meta.getMetaLine(node),
            name: meta.getMetaName(node),
            path: meta.getMetaPath(),
        })
        meta.injectMetaParam(node, id, pos)
    }
}
