import type { Meta } from "./types"
import { fallbackMeta } from "./fallbackMeta"
import { metaStack } from "./metaStack"

export function getMeta(): Meta {
    return metaStack.at(-1) ?? fallbackMeta
}
