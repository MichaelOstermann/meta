import { metaStack } from "./metaStack"

export function hasMeta(): boolean {
    return metaStack.at(-1) !== undefined
}
