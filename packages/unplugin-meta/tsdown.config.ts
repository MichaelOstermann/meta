import { defineConfig } from "tsdown"

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/*.ts"],
    external: ["@monstermann/transform-meta"],
    format: ["esm", "cjs"],
})
