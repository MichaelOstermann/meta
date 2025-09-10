import type { Meta } from "./types"

export function stringifyMeta(meta: Meta): string {
    const prefix = meta.name || "Anonymous"
    const suffix = meta.path && meta.line ? `${meta.path}:${meta.line}` : ""
    return `${prefix}(${suffix})`
}
