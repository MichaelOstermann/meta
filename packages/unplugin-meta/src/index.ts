import type { MetaPluginOptions } from "./types"
import { transformMeta } from "@monstermann/transform-meta"
import { createUnplugin } from "unplugin"

export { addMetaParam, setMetaParam, wrapWithMeta } from "@monstermann/transform-meta"

export default createUnplugin<MetaPluginOptions>(({
    enforce,
    exclude,
    getName,
    getPath,
    hmr,
    include,
    resolve,
}) => {
    let isViteDevServer = false

    return {
        enforce,
        name: "unplugin-meta",
        transform: {
            filter: {
                id: {
                    exclude,
                    include: include || [/\.[jt]sx?$/],
                },
            },
            handler(code, id) {
                return transformMeta(code, id, {
                    getName,
                    getPath,
                    hmr: hmr ?? isViteDevServer,
                    resolve,
                })
            },
        },
        vite: {
            configResolved(config) {
                isViteDevServer = config.command === "serve"
            },
        },
    }
})
