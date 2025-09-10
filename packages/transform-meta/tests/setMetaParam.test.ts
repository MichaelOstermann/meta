import { describe, expect, it } from "vitest"
import { transformMeta } from "../src/transformMeta"
import { setMetaParam } from "../src/utils/setMetaParam"

describe("setMetaParam", () => {
    it("should set simple call expressions", () => {
        const transformed = transformMeta(`
        const example = foo()
        const example = foo(bar)
        const example = foo(bar, baz)
        `, "source.ts", {
            resolve: setMetaParam({ foo: 2 }),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should set new expressions", () => {
        const transformed = transformMeta(`
        const example = new Foo()
        const example = new Foo(bar)
        const example = new Foo(bar, baz)
        `, "source.ts", {
            resolve: setMetaParam({ Foo: 2 }),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should set call expressions with nested member expressions", () => {
        const transformed = transformMeta(`
        const example = foo.bar.baz()
        const example = foo.bar.baz(bar)
        const example = foo.bar.baz(bar, baz)
        `, "source.ts", {
            resolve: setMetaParam({ "foo.bar.baz": 2 }),
        })
        expect(transformed?.code).toMatchSnapshot()
    })
})
