import type { TransformMetaOptions } from "./types"
import { transformMeta } from "./transformMeta"

export interface MetaPluginOptions extends TransformMetaOptions {
    enforce?: "post" | "pre"
    /** Skip files whose path matches one of these. */
    exclude?: RegExp | RegExp[]
    /**
     * Whether to attach the HMR handle, see `Meta.hmr`.
     * @default true when used with the dev server of Vite
     */
    hmr?: boolean
    /**
     * Only transform files whose path matches one of these.
     * @default /\.[jt]sx?$/
     */
    include?: RegExp | RegExp[]
}

export interface MetaPlugin {
    enforce?: "post" | "pre"
    name: string
    transform: {
        filter: { id: { exclude: RegExp[], include: RegExp[] } }
        handler: (code: string, id: string) => ReturnType<typeof transformMeta>
    }
    configResolved: (config: { command: string }) => void
}

/** A plugin for Vite, Rolldown and tsdown. */
export function meta({ enforce, exclude = [], hmr, include = /\.[jt]sx?$/, ...options }: MetaPluginOptions): MetaPlugin {
    let isViteDevServer = false

    const id = {
        exclude: [exclude].flat(),
        include: [include].flat(),
    }

    return {
        enforce,
        name: "meta",
        transform: {
            filter: { id },
            handler(code, path) {
                // Bundlers that do not know hook filters call the handler for every file.
                if (id.exclude.some(pattern => pattern.test(path))) return
                if (!id.include.some(pattern => pattern.test(path))) return
                return transformMeta(code, path, { ...options, hmr: hmr ?? isViteDevServer })
            },
        },
        configResolved(config) {
            isViteDevServer = config.command === "serve"
        },
    }
}
