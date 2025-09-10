import { describe, expect, it } from "vitest"
import { transformMeta } from "../src/transformMeta"
import { addMetaParam } from "../src/utils/addMetaParam"

describe("hmr", () => {
    it("should inject hmr setup", () => {
        const transformed = transformMeta(`const example = foo()`, "source.ts", {
            hmr: true,
            resolve: addMetaParam(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })
})
