import type { CallExpression, ImportDeclarationSpecifier, NewExpression, Node } from "oxc-parser"
import type { MetaHmrRef, MetaOptions, MetaParam, MetaResult } from "./types"
import Path from "node:path"
import MagicString from "magic-string"
import { parseSync } from "oxc-parser"
import { ScopeTracker, walk } from "oxc-walker"
import { getNodeName } from "./getNodeName"

const hmr = Symbol("hmr") as MetaHmrRef

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
 * const meta = { name: "count" };
 * const count = signal(0, meta);
 * ```
 *
 * Returns `undefined` when nothing changed.
 */
export function transform(code: string, filePath: string, options: MetaOptions): MetaResult | undefined {
    // Nothing to do when none of the modules are mentioned, skip parsing.
    if (!options.params.some(param => code.includes(param.module ?? param.function.split(".")[0]!))) return

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
    let relativePath: string | undefined
    const records = new Map<string, string>()

    walk(program, {
        scopeTracker,
        enter(node) {
            ancestors.push(node)
            if (node.type !== "CallExpression" && node.type !== "NewExpression") return
            const param = getParam(node)
            if (!param || !isAvailable(node, param.position)) return
            const record = createRecord(node, param)
            if (record) inject(node, param.position, record)
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

    /** The param of what is being called, if it is one of them. */
    function getParam(node: CallExpression | NewExpression): MetaParam | undefined {
        const [root, ...properties] = getIdentifiers(node.callee)
        if (!root) return
        const declaration = scopeTracker.getDeclaration(root)
        const isImport = declaration?.type === "Import" && declaration.importNode.importKind !== "type"
        const module = isImport ? declaration.importNode.source.value : undefined
        const importedName = isImport ? getImportedName(declaration.node, properties) : undefined
        const localName = [root, ...properties].join(".")
        return options.params.find((param) => {
            return param.module === undefined
                ? param.function === localName
                : param.module === module && param.function === importedName
        })
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

    /** Declares what the call receives, if anything. */
    function createRecord(node: Node, param: MetaParam): string | undefined {
        const path = getPath()
        const props: string[] = []

        for (const [key, value] of Object.entries(param.meta({ hmr, line: getLine(node), name: getName(), path }))) {
            let code: string
            if (value === hmr) {
                if (!options.hmr) continue
                code = hmrId ??= createHmr()
            }
            // The path is the same for every record of a module, and declared once.
            else if (value === path) {
                code = pathId ??= declare("path", JSON.stringify(path))
            }
            else {
                code = JSON.stringify(value)
            }
            props.push(`${/^[a-z_$][\w$]*$/i.test(key) ? key : JSON.stringify(key)}: ${code}`)
        }

        if (!props.length) return
        // Calls that receive the same share one record.
        const record = `{ ${props.join(", ")} }`
        let id = records.get(record)
        if (!id) records.set(record, id = declare("meta", record))
        return id
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
        return relativePath ??= Path.relative(process.cwd(), Path.resolve(filePath))
    }

    function getName(): string {
        const names: string[] = []
        for (const node of ancestors) getNodeName(node, names)
        return names.filter(Boolean).join(".")
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
