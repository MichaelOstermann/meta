import type { TransformMetaOptions } from "@monstermann/transform-meta"
import type { FilterPattern } from "unplugin"

export interface MetaPluginOptions extends TransformMetaOptions {
    enforce?: "post" | "pre" | undefined
    exclude?: FilterPattern
    include?: FilterPattern
}
