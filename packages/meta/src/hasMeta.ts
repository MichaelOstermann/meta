import { getMeta } from "./getMeta"

export function hasMeta(): boolean {
    return getMeta() !== undefined
}
