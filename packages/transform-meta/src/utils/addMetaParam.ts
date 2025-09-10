import type { TransformMetaResolver } from "../types"

export function addMetaParam(identifiers: string[]): TransformMetaResolver {
    return function (node, meta) {
        const name = meta.getCallExpressionName(node)
        if (!identifiers.includes(name)) return
        const id = meta.injectMetaRecord({
            line: meta.getMetaLine(node),
            name: meta.getMetaName(node),
            path: meta.getMetaPath(),
        })
        meta.injectMetaParam(node, id)
    }
}
