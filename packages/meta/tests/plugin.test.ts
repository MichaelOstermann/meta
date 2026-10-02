import Path from "node:path"
import { describe, expect, it } from "bun:test"
import { rolldown } from "rolldown"
import { meta, setMetaParam, transformMeta } from "../src"

const entry = Path.join(import.meta.dirname, "__fixtures__/entry.ts")

describe("meta", () => {
    it("should skip files that are excluded or not included", () => {
        const code = `import { foo } from "lib"\nfoo()`
        const plugin = meta({ exclude: /skipped/, resolve: setMetaParam("lib", { foo: 1 }) })
        expect(plugin.transform.handler(code, "/a/b.ts")?.code).toContain("foo(meta)")
        expect(plugin.transform.handler(code, "/a/skipped.ts")).toBe(undefined)
        expect(plugin.transform.handler(code, "/a/b.css")).toBe(undefined)
    })

    it("should enable hmr for the dev server of Vite", () => {
        const code = `import { foo } from "lib"\nfoo()`
        const plugin = meta({ resolve: setMetaParam("lib", { foo: 1 }) })
        expect(plugin.transform.handler(code, "/a/b.ts")?.code).not.toContain("import.meta.hot")
        plugin.configResolved({ command: "serve" })
        expect(plugin.transform.handler(code, "/a/b.ts")?.code).toContain("import.meta.hot")
    })

    it("should work with rolldown", async () => {
        const bundle = await rolldown({ input: entry, plugins: [meta({ resolve: setMetaParam("./lib", { foo: 2 }) })] })
        const { output } = await bundle.generate({ format: "esm" })
        expect(output[0].code).toContain(`name: "example"`)
    })
})

describe("transformMeta", () => {
    it("should work in an onLoad of Bun.build", async () => {
        const result = await Bun.build({
            entrypoints: [entry],
            plugins: [{
                name: "transforms",
                setup(build) {
                    build.onLoad({ filter: /\.tsx?$/ }, async ({ loader, path }) => {
                        const code = await Bun.file(path).text()
                        return { contents: transformMeta(code, path, { resolve: setMetaParam("./lib", { foo: 2 }) })?.code ?? code, loader }
                    })
                },
            }],
        })
        expect(await result.outputs[0]!.text()).toContain(`name: "example"`)
    })
})
