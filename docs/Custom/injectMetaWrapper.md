# injectMetaWrapper

```ts
function Meta.injectMetaWrapper(node: Node, metaId: string): void;
```

Takes a node and an identifier (referencing a `Meta` record) and wraps the node with `withMeta(${metaId}, () => node)`. The `withMeta` import will be added too if necessary.

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

                meta.injectMetaWrapper(node, metaId);
            },
        }),
    ],
};
```
