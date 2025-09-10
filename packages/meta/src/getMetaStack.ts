import type { Meta } from "./types"
import { metaStack } from "./metaStack"

export function getMetaStack(): (Meta | undefined)[] {
    return metaStack
}
