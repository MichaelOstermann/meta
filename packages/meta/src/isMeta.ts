import type { Meta } from "./types"

export function isMeta(value: unknown): value is Meta {
    return value != null
        && typeof value === "object"
        && "path" in value && typeof value.path === "string"
        && "line" in value && typeof value.line === "number"
        && "name" in value && typeof value.name === "string"
}
