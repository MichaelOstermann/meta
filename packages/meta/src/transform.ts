import type { CallExpression, ImportDeclarationSpecifier, NewExpression, Node } from "oxc-parser"
import type { MetaOptions, MetaResult } from "./types"
import Path from "node:path"
import MagicString from "magic-string"
import { parseSync } from "oxc-parser"
import { ScopeTracker, walk } from "oxc-walker"
import { getNodeName } from "./getNodeName"

/**
 * Passes metadata about call sites to the functions that are being called:
 *
 * ```ts
 * import { signal } from "signals";
 * const count = signal(0);
 * ```
 *
 * ```ts
 * import { signal } from "signals";
 * const path = "source.ts";
 * const meta = { path: path, line: 2, name: "count" };
 * const count = signal(0, meta);
 * ```
 *
 * Returns `undefined` when nothing changed.
 */
export function transform(code: string, filePath: string, options: MetaOptions): MetaResult | undefined {
    // Nothing to do when none of the modules are mentioned, skip parsing.
    if (!options.params.some(param => code.includes(param.module))) return

    const { program } = parseSync(filePath, code)
    const ms = new MagicString(code, { filename: filePath })
    const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
    const identifiers = new Set<string>()
    let importsEnd = 0

    walk(program, {
        scopeTracker,
        enter(node) {
            if (node.type === "Identifier") identifiers.add(node.name)
            else if (node.type === "ImportDeclaration") importsEnd = node.end
        },
    })

    // Keep all declarations, including hoisted ones, available for the next walk.
    scopeTracker.freeze()

    const ancestors: Node[] = []
    let pathId: string | undefined
    let hmrId: string | undefined

    walk(program, {
        scopeTracker,
        enter(node) {
            ancestors.push(node)
            if (node.type !== "CallExpression" && node.type !== "NewExpression") return
            const position = getPosition(node)
            if (position === undefined || !isAvailable(node, position)) return
            inject(node, position, createRecord(node))
        },
        leave() {
            ancestors.pop()
        },
    })

    if (!ms.hasChanged()) return

    return {
        code: ms.toString(),
        get map() {
            return ms.generateMap({
                hires: "boundary",
                includeContent: true,
                source: filePath,
            })
        },
    }

    /** The position of the meta argument, if what is being called has been imported from one of the modules. */
    function getPosition(node: CallExpression | NewExpression): number | undefined {
        const [root, ...properties] = getIdentifiers(node.callee)
        if (!root) return
        const declaration = scopeTracker.getDeclaration(root)
        if (declaration?.type !== "Import" || declaration.importNode.importKind === "type") return
        const module = declaration.importNode.source.value
        const name = getImportedName(declaration.node, properties)
        return options.params.find(param => param.module === module && param.function === name)?.position
    }

    /** Whether the argument is not taken yet, and its position is known. */
    function isAvailable(node: CallExpression | NewExpression, position: number): boolean {
        // new Foo
        if (code[node.end - 1] !== ")") return false
        if (node.arguments.length >= position) return false
        return !node.arguments.some(argument => argument.type === "SpreadElement")
    }

    function inject(node: CallExpression | NewExpression, position: number, metaId: string): void {
        const args = Array.from({ length: position - node.arguments.length - 1 }, () => "undefined").concat(metaId)
        // foo(bar,)
        const hasTrailingComma = /,\s*\)$/.test(code.slice(node.arguments.at(-1)?.end ?? node.end - 1, node.end))
        const prefix = node.arguments.length && !hasTrailingComma ? ", " : ""
        ms.appendRight(node.end - 1, prefix + args.join(", "))
    }

    function createRecord(node: Node): string {
        pathId ??= declare("path", JSON.stringify(getPath()))
        const props = [`path: ${pathId}`, `line: ${getLine(node)}`, `name: ${JSON.stringify(getName())}`]
        if (options.hmr) props.push(`hmr: ${hmrId ??= createHmr()}`)
        return declare("meta", `{ ${props.join(", ")} }`)
    }

    function createHmr(): string {
        const id = declare("hmr", `import.meta.hot ? (import.meta.hot.data["@monstermann/meta"] ??= new globalThis.Set()) : undefined`)
        ms.appendRight(importsEnd, `
if (${id}) {
    const clear = () => { for (const cb of ${id}) { ${id}.delete(cb); cb(); } }
    clear();
    import.meta.hot.dispose(clear);
    import.meta.hot.prune(clear);
}`)
        return id
    }

    /** Declares a constant below the imports, using a name that is not taken yet. */
    function declare(name: string, value: string): string {
        let i = 0
        let id = name
        while (identifiers.has(id)) id = `${name}${++i}`
        identifiers.add(id)
        ms.appendRight(importsEnd, `\nconst ${id} = ${value};`)
        return id
    }

    function getPath(): string {
        const path = Path.relative(process.cwd(), Path.resolve(filePath))
        return options.getPath?.(path) ?? path
    }

    function getName(): string {
        const names: string[] = []
        for (const node of ancestors) getNodeName(node, names)
        const name = names.filter(Boolean).join(".")
        return options.getName?.(name) ?? name
    }

    function getLine(node: Node): number {
        let line = 1
        for (let i = 0; i < node.start; i++) {
            if (code.charCodeAt(i) === 10) line++
        }
        return line
    }
}

/** The name of what is being called, as exported by its module. */
function getImportedName(specifier: ImportDeclarationSpecifier, properties: string[]): string | undefined {
    // import * as Foo from "foo"; Foo.bar()
    if (specifier.type === "ImportNamespaceSpecifier") return properties.join(".")
    // import Foo from "foo"; Foo.bar()
    if (specifier.type === "ImportDefaultSpecifier") return ["default", ...properties].join(".")
    if (specifier.importKind === "type") return
    // import { foo as bar } from "foo"; bar()
    const imported = specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value
    return [imported, ...properties].join(".")
}

/** `foo.bar.baz` → `["foo", "bar", "baz"]` */
function getIdentifiers(node: Node): string[] {
    if (node.type === "Identifier") return [node.name]
    if (node.type !== "MemberExpression" || node.computed || node.property.type !== "Identifier") return []
    const identifiers = getIdentifiers(node.object)
    return identifiers.length ? [...identifiers, node.property.name] : []
}
