import type { TransformMetaOptions } from "../src"
import { describe, expect, it } from "bun:test"
import { addMetaParam, setMetaParam, transformMeta, wrapWithMeta } from "../src"

function run(code: string, resolve: TransformMetaOptions["resolve"], options?: Partial<TransformMetaOptions> & { filePath?: string }): string | undefined {
    return transformMeta(dedent(code), options?.filePath ?? "source.ts", { ...options, resolve })?.code
}

function dedent(code: string): string {
    const lines = code.split("\n").filter((line, i, lines) => line.trim() || (i > 0 && i < lines.length - 1))
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
    return lines.map(line => line.slice(indent)).join("\n")
}

describe("addMetaParam", () => {
    it("should append to calls, new expressions and members", () => {
        expect(run(`
            import { foo, Foo } from "lib"
            const a = foo()
            const b = foo(bar)
            const c = new Foo()
            const d = new Foo(bar)
            const e = foo.bar.baz(bar)
        `, addMetaParam("lib", ["foo", "Foo", "foo.bar.baz"]))).toBe(dedent(`
            import { foo, Foo } from "lib"
            const path = "source.ts";
            const meta = { path: path, line: 2, name: "a" };
            const meta1 = { path: path, line: 3, name: "b" };
            const meta2 = { path: path, line: 4, name: "c" };
            const meta3 = { path: path, line: 5, name: "d" };
            const meta4 = { path: path, line: 6, name: "e" };
            const a = foo(meta)
            const b = foo(bar, meta1)
            const c = new Foo(meta2)
            const d = new Foo(bar, meta3)
            const e = foo.bar.baz(bar, meta4)
        `))
    })

    it("should append after spread arguments and trailing commas", () => {
        expect(run(`
            import { foo } from "lib"
            const a = foo(...args)
            const b = foo(bar, )
        `, addMetaParam("lib", ["foo"]))).toEndWith(dedent(`
            const a = foo(...args, meta)
            const b = foo(bar, meta1)
        `))
    })
})

describe("setMetaParam", () => {
    it("should set the nth argument", () => {
        expect(run(`
            import { foo, Foo } from "lib"
            const a = foo()
            const b = foo(bar)
            const c = new Foo(bar)
            const d = foo(bar,
            )
        `, setMetaParam("lib", { foo: 3, Foo: 2 }))).toEndWith(dedent(`
            const a = foo(undefined, undefined, meta)
            const b = foo(bar, undefined, meta1)
            const c = new Foo(bar, meta2)
            const d = foo(bar,
            undefined, meta3)
        `))
    })

    it("should skip calls where the argument is taken or its position is unknown", () => {
        expect(run(`
            import { foo, Foo } from "lib"
            const a = foo(bar, baz)
            const b = foo(...args)
            const c = new Foo
        `, setMetaParam("lib", { foo: 2, Foo: 2 }))).toBe(undefined)
    })
})

describe("wrapWithMeta", () => {
    it("should wrap calls", () => {
        expect(run(`
            import { foo, Foo } from "lib"
            const a = foo()
            const b = new Foo()
        `, wrapWithMeta("lib", ["foo", "Foo"]))).toBe(dedent(`
            import { foo, Foo } from "lib"
            import { withMeta } from "@monstermann/meta";
            const path = "source.ts";
            const meta = { path: path, line: 2, name: "a" };
            const meta1 = { path: path, line: 3, name: "b" };
            const a = withMeta(meta, () => foo())
            const b = withMeta(meta1, () => new Foo())
        `))
    })

    it("should reuse existing imports", () => {
        expect(run(`
            import { withMeta as wrap } from "@monstermann/meta";
            import { foo } from "lib"
            const a = foo()
        `, wrapWithMeta("lib", ["foo"]))).toEndWith(`const a = wrap(meta, () => foo())`)
    })

    it("should not introduce conflicting imports", () => {
        expect(run(`
            import { foo } from "lib"
            const withMeta = "example"
            const a = foo()
        `, wrapWithMeta("lib", ["foo"]))).toBe(dedent(`
            import { foo } from "lib"
            import { withMeta as withMeta1 } from "@monstermann/meta";
            const path = "source.ts";
            const meta = { path: path, line: 3, name: "a" };
            const withMeta = "example"
            const a = withMeta1(meta, () => foo())
        `))
    })
})

describe("imports", () => {
    const resolve = addMetaParam("lib", ["foo", "foo.bar", "default.bar"])

    it("should match renamed imports", () => {
        expect(run(`
            import { foo as baz } from "lib"
            const a = baz()
        `, resolve)).toEndWith(`const a = baz(meta)`)
    })

    it("should match namespace imports", () => {
        expect(run(`
            import * as Lib from "lib"
            const a = Lib.foo()
            const b = Lib.foo.bar()
        `, resolve)).toEndWith(`const a = Lib.foo(meta)\nconst b = Lib.foo.bar(meta1)`)
    })

    it("should match default imports", () => {
        expect(run(`
            import Lib from "lib"
            const a = Lib.bar()
        `, resolve)).toEndWith(`const a = Lib.bar(meta)`)
    })

    it("should ignore everything that is not the import", () => {
        expect(run(`
            import { foo } from "other"
            import type { foo as Foo } from "lib"
            import { bar } from "lib"
            foo()
            bar()
            function a(foo) { foo() }
            function b() { const foo = () => {}; foo() }
            function c() { foo(); function foo() {} }
            Foo.foo()
            obj.foo()
            foo["bar"]()
        `, resolve)).toBe(undefined)
    })

    it("should respect shadowed imports", () => {
        expect(run(`
            import { foo } from "lib"
            function a(foo) { foo() }
            function b() { foo(); function foo() {} }
            function c() { foo() }
        `, resolve)).toEndWith(dedent(`
            function a(foo) { foo() }
            function b() { foo(); function foo() {} }
            function c() { foo(meta) }
        `))
    })
})

describe("meta", () => {
    const resolve = addMetaParam("lib", ["foo"])

    it("should ensure unique identifiers", () => {
        expect(run(`
            import { foo } from "lib"
            const path = "example"
            const meta = "example"
            const a = foo()
            const b = foo()
        `, resolve)).toBe(dedent(`
            import { foo } from "lib"
            const path1 = "source.ts";
            const meta1 = { path: path1, line: 4, name: "a" };
            const meta2 = { path: path1, line: 5, name: "b" };
            const path = "example"
            const meta = "example"
            const a = foo(meta1)
            const b = foo(meta2)
        `))
    })

    it("should find names", () => {
        const code = run(`
            import { foo } from "lib"
            function a() {
                return foo()
            }
            const b = {
                c: foo()
            }
            class D {
                e = foo()
                f() {
                    this.g = foo()
                }
            }
        `, resolve)
        expect(code).toContain(`{ path: path, line: 3, name: "a" }`)
        expect(code).toContain(`{ path: path, line: 6, name: "b.c" }`)
        expect(code).toContain(`{ path: path, line: 9, name: "D.e" }`)
        expect(code).toContain(`{ path: path, line: 11, name: "D.f.g" }`)
    })

    it("should escape paths and names", () => {
        const code = run(`
            import { foo } from "lib"
            const a = foo()
        `, resolve, {
            getName: () => `say "hi"`,
            getPath: () => "src\\tasks\\new.ts",
        })
        expect(code).toContain(String.raw`const path = "src\\tasks\\new.ts";`)
        expect(code).toContain(String.raw`name: "say \"hi\""`)
    })

    it("should inject the hmr setup", () => {
        const code = run(`
            import { foo } from "lib"
            const a = foo()
        `, resolve, { hmr: true })
        expect(code).toContain(`const hmr = import.meta.hot ? (import.meta.hot.data["@monstermann/meta"] ??= new globalThis.Set()) : undefined;`)
        expect(code).toContain(`const meta = { path: path, line: 2, name: "a", hmr: hmr };`)
    })

    it("should create sourcemaps", () => {
        const result = transformMeta(`import { foo } from "lib"\nfoo()`, "source.ts", { resolve })
        expect(result!.map.sources).toEqual(["source.ts"])
        expect(result!.map.mappings).toBeTruthy()
    })
})
