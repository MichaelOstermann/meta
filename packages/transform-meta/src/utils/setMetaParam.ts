import type { TransformMetaResolver } from "../types"

export function setMetaParam(identifiers: Record<string, number>): TransformMetaResolver {
    return function (node, meta) {
        const name = meta.getCallExpressionName(node)
        const pos = identifiers[name]
        if (pos == null) return
        const id = meta.injectMetaRecord({
            line: meta.getMetaLine(node),
            name: meta.getMetaName(node),
            path: meta.getMetaPath(),
        })
        meta.injectMetaParam(node, id, pos)
    }
}
