import { describe, expect, it } from "vitest"
import { transformMeta } from "../src/transformMeta"
import { addMetaParam } from "../src/utils/addMetaParam"

describe("addMetaParam", () => {
    it("should append simple call expressions", () => {
        const transformed = transformMeta(`
        const example = foo()
        const example = foo(bar)
        `, "source.ts", {
            resolve: addMetaParam(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should append new expressions", () => {
        const transformed = transformMeta(`
        const example = new Foo()
        const example = new Foo(bar)
        `, "source.ts", {
            resolve: addMetaParam(["Foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should append call expressions with nested member expressions", () => {
        const transformed = transformMeta(`
        const example = foo.bar.baz()
        const example = foo.bar.baz(bar)
        `, "source.ts", {
            resolve: addMetaParam(["foo.bar.baz"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })
})
