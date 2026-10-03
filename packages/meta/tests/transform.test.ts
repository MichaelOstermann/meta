import type { MetaOptions, MetaParam } from "../src"
import { describe, expect, it } from "bun:test"
import { transform } from "../src"

// eslint-disable-next-line perfectionist/sort-objects
const all: MetaParam["meta"] = ({ hmr, line, name, path }) => ({ path, line, name, hmr })

/** `{ lib: { foo: 2 } }` → `[{ module: "lib", function: "foo", position: 2 }]` */
function toParams(modules: Record<string, Record<string, number>>): MetaOptions["params"] {
    return Object.entries(modules).flatMap(([module, functions]) => {
        return Object.entries(functions).map(([name, position]) => ({ function: name, meta: all, module, position }))
    })
}

function run(code: string, modules: Record<string, Record<string, number>>, options?: Partial<MetaOptions>): string | undefined {
    return transform(dedent(code), "source.ts", { ...options, params: toParams(modules) })?.code
}

function dedent(code: string): string {
    const lines = code.split("\n").filter((line, i, lines) => line.trim() || (i > 0 && i < lines.length - 1))
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
    return lines.map(line => line.slice(indent)).join("\n")
}

describe("calls", () => {
    it("should set the nth argument", () => {
        expect(run(`
            import { foo, Foo } from "lib"
            const a = foo()
            const b = foo(bar)
            const c = new Foo(bar)
            const d = foo(bar,
            )
        `, { lib: { foo: 3, Foo: 2 } })).toEndWith(dedent(`
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
        `, { lib: { foo: 2, Foo: 2 } })).toBe(undefined)
    })
})

describe("setMetaParam", () => {
    it("should support members, new expressions and trailing commas", () => {
        expect(run(`
            import { foo, Foo } from "lib"
            const a = foo.bar.baz(bar)
            const b = new Foo()
            const c = foo(bar, )
        `, { lib: { "foo": 2, "Foo": 1, "foo.bar.baz": 2 } })).toBe(dedent(`
            import { foo, Foo } from "lib"
            const path = "source.ts";
            const meta = { path: path, line: 2, name: "a" };
            const meta1 = { path: path, line: 3, name: "b" };
            const meta2 = { path: path, line: 4, name: "c" };
            const a = foo.bar.baz(bar, meta)
            const b = new Foo(meta1)
            const c = foo(bar, meta2)
        `))
    })

    it("should support multiple modules", () => {
        expect(run(`
            import { foo } from "a"
            import { bar } from "b"
            const a = foo()
            const b = bar()
        `, { a: { foo: 1 }, b: { bar: 2 } })).toEndWith(dedent(`
            const a = foo(meta)
            const b = bar(undefined, meta1)
        `))
    })
})

describe("imports", () => {
    const params = { lib: { "default.bar": 1, "foo": 1, "foo.bar": 1 } }

    it("should match renamed imports", () => {
        expect(run(`
            import { foo as baz } from "lib"
            const a = baz()
        `, params)).toEndWith(`const a = baz(meta)`)
    })

    it("should match namespace imports", () => {
        expect(run(`
            import * as Lib from "lib"
            const a = Lib.foo()
            const b = Lib.foo.bar()
        `, params)).toEndWith(`const a = Lib.foo(meta)\nconst b = Lib.foo.bar(meta1)`)
    })

    it("should match default imports", () => {
        expect(run(`
            import Lib from "lib"
            const a = Lib.bar()
        `, params)).toEndWith(`const a = Lib.bar(meta)`)
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
        `, params)).toBe(undefined)
    })

    it("should respect shadowed imports", () => {
        expect(run(`
            import { foo } from "lib"
            function a(foo) { foo() }
            function b() { foo(); function foo() {} }
            function c() { foo() }
        `, params)).toEndWith(dedent(`
            function a(foo) { foo() }
            function b() { foo(); function foo() {} }
            function c() { foo(meta) }
        `))
    })
})

describe("params without a module", () => {
    it("should match everything that is called by that name", () => {
        expect(transform(dedent(`
            import { foo } from "lib"
            import { foo as bar } from "other"
            function baz() {}
            foo()
            bar()
            baz()
            Baz.qux()
            window.foo()
        `), "source.ts", {
            params: [
                { function: "foo", meta: all, position: 1 },
                { function: "baz", meta: all, position: 2 },
                { function: "Baz.qux", meta: all, position: 1 },
            ],
        })?.code).toEndWith(dedent(`
            foo(meta)
            bar()
            baz(undefined, meta1)
            Baz.qux(meta2)
            window.foo()
        `))
    })

    it("should prefer the first matching param", () => {
        expect(transform(`import { foo } from "lib"\nfoo()`, "source.ts", {
            params: [
                { function: "foo", meta: all, module: "lib", position: 2 },
                { function: "foo", meta: all, position: 1 },
            ],
        })?.code).toEndWith(`foo(undefined, meta)`)
    })
})

describe("meta", () => {
    const params = { lib: { foo: 1 } }

    it("should ensure unique identifiers", () => {
        expect(run(`
            import { foo } from "lib"
            const path = "example"
            const meta = "example"
            const a = foo()
            const b = foo()
        `, params)).toBe(dedent(`
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
        `, params)
        expect(code).toContain(`{ path: path, line: 3, name: "a" }`)
        expect(code).toContain(`{ path: path, line: 6, name: "b.c" }`)
        expect(code).toContain(`{ path: path, line: 9, name: "D.e" }`)
        expect(code).toContain(`{ path: path, line: 11, name: "D.f.g" }`)
    })

    it("should escape paths and names", () => {
        const code = transform(`import { foo } from "lib"\nconst a = foo()`, String.raw`src\tasks\new.ts`, {
            params: [{ function: "foo", module: "lib", position: 1, meta: ({ path }) => ({ name: `say "hi"`, path }) }],
        })?.code
        expect(code).toContain(String.raw`const path = "src\\tasks\\new.ts";`)
        expect(code).toContain(String.raw`name: "say \"hi\""`)
    })

    it("should inject the hmr setup for params that ask for it", () => {
        const code = transform(`import { foo, bar } from "lib"\nconst a = foo()\nconst b = bar()`, "source.ts", {
            hmr: true,
            params: [
                { function: "foo", meta: all, module: "lib", position: 1 },
                { function: "bar", module: "lib", position: 1, meta: ({ name }) => ({ name }) },
            ],
        })?.code
        expect(code).toContain(`const hmr = import.meta.hot ? (import.meta.hot.data["@monstermann/meta"] ??= new globalThis.Set()) : undefined;`)
        expect(code).toContain(`const meta = { path: path, line: 2, name: "a", hmr: hmr };`)
        expect(code).toContain(`const meta1 = { name: "b" };`)
    })

    it("should leave hmr out without the option", () => {
        const code = run(`
            import { foo } from "lib"
            const a = foo()
        `, params)
        expect(code).toContain(`const meta = { path: path, line: 2, name: "a" };`)
        expect(code).not.toContain("import.meta.hot")
    })

    it("should create sourcemaps", () => {
        const result = transform(`import { foo } from "lib"\nfoo()`, "source.ts", { params: toParams(params) })
        expect(result!.map.sources).toEqual(["source.ts"])
        expect(result!.map.mappings).toBeTruthy()
    })
})

describe("records", () => {
    const code = `import { foo } from "lib"\nconst a = foo()`
    const param = { function: "foo", module: "lib", position: 1 }

    it("should let a param decide what it receives", () => {
        const result = transform(code, "source.ts", {
            params: [{ ...param, meta: ({ line, name, path }) => ({ "at": `${path}:${line}`, "debug": true, name, "not-an-identifier": 1, "nothing": null }) }],
        })?.code
        expect(result).toContain(`const meta = { at: "source.ts:2", debug: true, name: "a", "not-an-identifier": 1, nothing: null };`)
        expect(result).toContain("foo(meta)")
        expect(result).not.toContain("const path")
    })

    it("should share the path between records", () => {
        const result = transform(`${code}\nconst b = foo()`, "source.ts", {
            params: [{ ...param, meta: ({ line, path }) => ({ file: path, line }) }],
        })?.code
        expect(result).toContain(`const path = "source.ts";`)
        expect(result).toContain(`const meta = { file: path, line: 2 };`)
        expect(result).toContain(`const meta1 = { file: path, line: 3 };`)
    })

    it("should pass hmr under any name", () => {
        const result = transform(code, "source.ts", {
            hmr: true,
            params: [{ ...param, meta: ({ hmr }) => ({ onReplace: hmr }) }],
        })?.code
        expect(result).toContain(`const meta = { onReplace: hmr };`)
        expect(result).not.toContain("const path")
    })

    it("should share records that are the same", () => {
        const result = transform(`${code}\nconst b = foo()`, "source.ts", {
            hmr: true,
            params: [{ ...param, meta: ({ hmr }) => ({ hmr }) }],
        })?.code
        expect(result).toContain(`const meta = { hmr: hmr };`)
        expect(result).not.toContain("meta1")
        expect(result).toContain("const a = foo(meta)\nconst b = foo(meta)")
    })

    it("should leave calls alone that would receive nothing", () => {
        expect(transform(code, "source.ts", { params: [{ ...param, meta: ({ hmr }) => ({ hmr }) }] })).toBe(undefined)
        expect(transform(code, "source.ts", { hmr: true, params: [{ ...param, meta: () => ({}) }] })).toBe(undefined)
    })
})
