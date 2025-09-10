/* eslint-disable @stylistic/max-statements-per-line */
import type { Meta } from "./types"
import { metaStack } from "./metaStack"

export function withMeta<T>(meta: Meta | undefined, fn: () => T): T {
    metaStack.push(meta)
    try { return fn() }
    finally { metaStack.pop() }
}
