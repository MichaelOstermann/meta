import { describe, expect, it } from "bun:test"
import { fallbackMeta, getMeta, getMetaStack, hasMeta, isMeta, stringifyMeta, withMeta } from "../src"

const meta = { line: 1, name: "example", path: "source.ts" }

describe("meta", () => {
    it("should provide meta while the callback runs", () => {
        expect(hasMeta()).toBe(false)
        expect(getMeta()).toBe(fallbackMeta)
        expect(withMeta(meta, () => [hasMeta(), getMeta(), getMetaStack().length])).toEqual([true, meta, 1])
        expect(withMeta(meta, () => withMeta(undefined, () => [hasMeta(), getMeta()]))).toEqual([false, fallbackMeta])
        expect(hasMeta()).toBe(false)
    })

    it("should restore the stack when the callback throws", () => {
        expect(() => withMeta(meta, () => {
            throw new Error("example")
        })).toThrow("example")
        expect(getMetaStack()).toEqual([])
    })

    it("should recognize and stringify meta", () => {
        expect(isMeta(meta)).toBe(true)
        expect(isMeta({ line: 1 })).toBe(false)
        expect(stringifyMeta(meta)).toBe("example(source.ts:1)")
        expect(stringifyMeta(fallbackMeta)).toBe("Anonymous()")
    })
})
