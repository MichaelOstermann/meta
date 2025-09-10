export interface Meta {
    readonly hmr?: Set<() => void>
    readonly line: number
    readonly name: string
    readonly path: string
}
