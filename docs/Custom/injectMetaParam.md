# injectMetaParam

```ts
function Meta.injectMetaParam(
    node: Node,
    metaId: string,
    argPos?: number
): void;
```

Takes a node, an identifier (referencing a `Meta` record) and injects `${metaId}` at the provided argument position, filling any missing arguments with `undefined`s, or simply appends a new argument if `argPos` is unused.

Ignored if the given node is not a call expression.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                const metaId = meta.injectMetaRecord({
                    path: "foo",
                    line: 2,
                    name: "bar",
                });

                meta.injectMetaParam(node, metaId, 1);
            },
        }),
    ],
};
```
