# Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                // When encountering `bar()`:
                if (meta.getCallExpressionName(node) === "bar") {
                    // Inject `const meta = { path, name, line }` into the body:
                    const metaVarName = meta.injectMetaRecord({
                        path: "foo/bar.ts",
                        name: "Hello world!",
                        line: 1,
                    });

                    // Add a `meta` argument to `bar()`:
                    meta.injectMetaParam(node, metaVarName);
                }
            },
        }),
    ],
};
```
