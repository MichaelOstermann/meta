import type { SourceMap } from "magic-string"
import type { TransformMetaOptions } from "./types"
import { walk } from "oxc-walker"
import { Meta } from "./Meta"

export function transformMeta(
    code: string,
    filePath: string,
    options: TransformMetaOptions,
): {
    code: string
    map: SourceMap
} | undefined {
    const meta = new Meta(code, filePath, options)
    const resolvers = Array.isArray(options.resolve) ? options.resolve : [options.resolve]

    walk(meta.ast, {
        enter(node) {
            for (const resolve of resolvers) {
                resolve(node, meta)
            }
        },
    })

    if (!meta.ms.hasChanged()) return

    return {
        code: meta.ms.toString(),
        get map() {
            return meta.ms.generateMap({
                hires: "boundary",
                includeContent: true,
                source: filePath,
            })
        },
    }
}
