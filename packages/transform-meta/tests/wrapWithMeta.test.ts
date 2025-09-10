import { describe, expect, it } from "vitest"
import { transformMeta } from "../src/transformMeta"
import { wrapWithMeta } from "../src/utils/wrapWithMeta"

describe("wrapWithMeta", () => {
    it("should wrap simple call expressions", () => {
        const transformed = transformMeta("const example = foo()", "source.ts", {
            resolve: wrapWithMeta(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should wrap new expressions", () => {
        const transformed = transformMeta("const example = new Foo()", "source.ts", {
            resolve: wrapWithMeta(["Foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should wrap call expressions with nested member expressions", () => {
        const transformed = transformMeta("const example = foo.bar.baz()", "source.ts", {
            resolve: wrapWithMeta(["foo.bar.baz"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should reuse existing imports", () => {
        const transformed = transformMeta(`
        import { withMeta as wrap } from "@monstermann/meta";
        const example = foo()
        `, "source.ts", {
            resolve: wrapWithMeta(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should not introduce conflicting imports", () => {
        const transformed = transformMeta(`
        const withMeta = "example"
        const example = foo()
        `, "source.ts", {
            resolve: wrapWithMeta(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })
})
