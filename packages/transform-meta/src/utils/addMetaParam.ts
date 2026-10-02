import type { TransformMetaResolver } from "../types"

/** Appends the metadata to the arguments of the given functions imported from `from`. */
export function addMetaParam(from: string, identifiers: string[]): TransformMetaResolver {
    return function (node, meta) {
        const name = meta.getImportedCallExpressionName(node, from)
        if (!identifiers.includes(name) || !meta.canInjectMetaParam(node)) return
        const id = meta.injectMetaRecord({
            line: meta.getMetaLine(node),
            name: meta.getMetaName(node),
            path: meta.getMetaPath(),
        })
        meta.injectMetaParam(node, id)
    }
}
