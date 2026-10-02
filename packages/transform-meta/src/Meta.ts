import type { Node, Program } from "oxc-parser"
import type { TransformMetaOptions } from "./types"
import Path from "node:path"
import MagicString from "magic-string"
import { parseSync } from "oxc-parser"
import { ScopeTracker, walk } from "oxc-walker"
import { getCallExpressionIdentifiers, getCallExpressionName } from "./helpers/getCallExpressionName"
import { getNodeName } from "./helpers/getNodeName"

export class Meta {
    ast: Program
    code: string
    filePath: string
    ms: MagicString
    scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
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

    /**
     * Returns the name of what is being called if it has been imported from `from`, regardless of how it is called locally:
     *
     * ```ts
     * import { foo as bar } from "from"; bar() // "foo"
     * import { foo } from "from"; foo.bar() // "foo.bar"
     * import * as Foo from "from"; Foo.bar() // "bar"
     * import Foo from "from"; Foo.bar() // "default.bar"
     * ```
     *
     * Only works while walking the AST, as it depends on the scope of the node.
     */
    getImportedCallExpressionName(node: Node, from: string): string {
        const [root, ...properties] = getCallExpressionIdentifiers(node)
        if (!root) return ""
        const declaration = this.scopeTracker.getDeclaration(root)
        if (declaration?.type !== "Import") return ""
        if (declaration.importNode.source.value !== from) return ""
        if (declaration.importNode.importKind === "type") return ""
        const specifier = declaration.node
        if (specifier.type === "ImportNamespaceSpecifier") return properties.join(".")
        if (specifier.type === "ImportDefaultSpecifier") return ["default", ...properties].join(".")
        if (specifier.importKind === "type") return ""
        const imported = specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value
        return [imported, ...properties].join(".")
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

    /**
     * Whether a parameter can be added to the call, optionally at the given position (starting at `1`).
     * This is not the case when the position is already taken, or unknown because of spread arguments.
     */
    canInjectMetaParam(node: Node, argPos?: number): boolean {
        if (node.type !== "CallExpression" && node.type !== "NewExpression") return false
        // new Foo
        if (this.code[node.end - 1] !== ")") return false
        if (argPos == null) return true
        if (node.arguments.length >= argPos) return false
        return !node.arguments.some(argument => argument.type === "SpreadElement")
    }

    injectMetaParam(node: Node, metaId: string, argPos?: number): void {
        if (node.type !== "CallExpression" && node.type !== "NewExpression") return
        if (!this.canInjectMetaParam(node, argPos)) return
        const args = Array.from({ length: (argPos ?? 1) - node.arguments.length - 1 }, () => "undefined").concat(metaId)
        // foo(bar,)
        const hasTrailingComma = /,\s*\)$/.test(this.code.slice(node.arguments.at(-1)?.end ?? node.end - 1, node.end))
        const prefix = node.arguments.length && !hasTrailingComma ? ", " : ""
        this.ms.appendRight(node.end - 1, prefix + args.join(", "))
    }

    injectMetaPath(path: string): string {
        if (!this.#ids.has("path")) {
            const pathId = this.generateId("path")
            this.injectCode(`const ${pathId} = ${JSON.stringify(path)};`)
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
        const props: string[] = [`path: ${pathId}`, `line: ${line}`, `name: ${JSON.stringify(name)}`]
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
            scopeTracker: this.scopeTracker,
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
        // Keep all declarations, including hoisted ones, available for the next walk.
        this.scopeTracker.freeze()
    }
}
