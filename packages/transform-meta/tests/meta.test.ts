import { describe, expect, it } from "vitest"
import { transformMeta } from "../src/transformMeta"
import { addMetaParam } from "../src/utils/addMetaParam"

describe("meta", () => {
    it("should ensure unique identifiers", () => {
        const transformed = transformMeta(`
        const path = "example"
        const meta = "example"
        const example = foo()
        const example = foo()
        const example = foo()
        const example = foo()
        `, "source.ts", {
            resolve: addMetaParam(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })

    it("should find and use different identifiers", () => {
        const transformed = transformMeta(`
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
        `, "source.ts", {
            resolve: addMetaParam(["foo"]),
        })
        expect(transformed?.code).toMatchSnapshot()
    })
})
