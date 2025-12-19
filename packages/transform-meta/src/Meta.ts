import type { Node, Program } from "oxc-parser"
import type { TransformMetaOptions } from "./types"
import Path from "node:path"
import MagicString from "magic-string"
import { parseSync } from "oxc-parser"
import { walk } from "oxc-walker"
import { getCallExpressionName } from "./helpers/getCallExpressionName"
import { getNodeName } from "./helpers/getNodeName"

export class Meta {
    ast: Program
    code: string
    filePath: string
    ms: MagicString
    usedIds = new Set<string>()
    #bodyOffset = 0
    #ids = new Map<string, string>()
    #options: TransformMetaOptions
    #parentNodes = new Map<Node, Node>()

    constructor(code: string, filePath: string, options: TransformMetaOptions) {
        this.code = code
        this.filePath = filePath
        this.#options = options
        this.ms = new MagicString(code, { filename: filePath })
        this.ast = parseSync(filePath, code).program
        this.#walkAst()
    }

    generateId(name: string): string {
        let i = 0
        let id = name
        while (this.usedIds.has(id)) {
            id = `${name}${++i}`
        }
        this.#ids.set(name, id)
        this.usedIds.add(id)
        return id
    }

    getCallExpressionName(node: Node): string {
        return getCallExpressionName(node)
    }

    getMetaLine(node: Node): number {
        let line = 1
        for (let i = 0; i < node.start; i++) {
            if (this.code.charCodeAt(i) === 10) line++
        }
        return line
    }

    getMetaName(node: Node): string {
        const names: string[] = []
        const nodes = [...this.getParentNodes(node), node]
        for (const n of nodes) getNodeName(n, names)
        const name = names.filter(Boolean).join(".")
        return this.#options.getName?.(name, node, this) ?? name
    }

    getMetaPath(): string {
        const path = Path.relative(process.cwd(), Path.resolve(this.filePath))
        return this.#options.getPath?.(path, this) ?? path
    }

    getParentNodes(node: Node): Node[] {
        const nodes: Node[] = []
        let pivot = this.#parentNodes.get(node)
        while (pivot) {
            nodes.unshift(pivot)
            pivot = this.#parentNodes.get(pivot)
        }
        return nodes
    }

    injectCode(code: string): void {
        this.ms.appendRight(this.#bodyOffset, `\n${code}`)
    }

    injectHmrSetup(): string {
        if (this.#ids.has("hmr")) return this.#ids.get("hmr")!
        const hmrId = this.generateId("hmr")
        this.injectCode(`const ${hmrId} = import.meta.hot ? (import.meta.hot.data["@monstermann/meta"] ??= new globalThis.Set()) : undefined;
if (${hmrId}) {
    const clear = () => { for (const cb of ${hmrId}) { ${hmrId}.delete(cb); cb(); } }
    clear();
    import.meta.hot.dispose(clear);
    import.meta.hot.prune(clear);
}`)
        return hmrId
    }

    injectImport(code: string): void {
        this.ms.appendLeft(this.#bodyOffset, `\n${code}`)
    }

    injectMetaImport(name: string): string {
        if (this.#ids.has(name)) return this.#ids.get(name)!
        const id = this.generateId(name)
        if (id === name) this.injectImport(`import { ${name} } from "@monstermann/meta";`)
        else this.injectImport(`import { ${name} as ${id} } from "@monstermann/meta";`)
        return id
    }

    injectMetaParam(node: Node, metaId: string, argPos?: number): void {
        if (node.type !== "CallExpression") return
        let argLen = node.arguments.length

        const prefix = (val: string) => argLen > 0 ? `, ${val}` : val
        const append = (val: string) => this.ms.appendRight(node.end - 1, prefix(val))

        if (argPos == null) {
            append(metaId)
        }
        else if (argLen < argPos) {
            for (let i = argLen; i < argPos - 1; i++) {
                append("undefined")
                argLen++
            }
            append(metaId)
        }
    }

    injectMetaPath(path: string): string {
        if (!this.#ids.has("path")) {
            const pathId = this.generateId("path")
            this.injectCode(`const ${pathId} = "${path}";`)
        }
        return this.#ids.get("path")!
    }

    injectMetaRecord({ line, name, path }: {
        line: number
        name: string
        path: string
    }): string {
        const metaId = this.generateId("meta")
        const pathId = this.injectMetaPath(path)
        const props: string[] = [`path: ${pathId}`, `line: ${line}`, `name: "${name}"`]
        if (this.#options.hmr) props.push(`hmr: ${this.injectHmrSetup()}`)
        this.injectCode(`const ${metaId} = { ${props.join(", ")} };`)
        return metaId
    }

    injectMetaWrapper(node: Node, metaId: string): void {
        const withMetaId = this.injectMetaImport("withMeta")
        this.ms.appendLeft(node.start, `${withMetaId}(${metaId}, () => `)
        this.ms.appendRight(node.end, ")")
    }

    #walkAst() {
        walk(this.ast, {
            enter: (node, parent) => {
                if (node.type === "Identifier") this.usedIds.add(node.name)
                if (node.type === "ImportDeclaration") this.#bodyOffset = node.end
                if (node.type === "ImportDeclaration" && node.source.value === "@monstermann/meta") {
                    for (const spec of node.specifiers) {
                        if (spec.type !== "ImportSpecifier") continue
                        if (spec.imported.type === "Identifier" && spec.local.type === "Identifier") {
                            this.#ids.set(spec.imported.name, spec.local.name)
                        }
                    }
                }
                if (parent) this.#parentNodes.set(node, parent)
            },
        })
    }
}
