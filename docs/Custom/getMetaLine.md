### getMetaLine

```ts
function Meta.getMetaLine(node: Node): number;
```

Takes a node and returns its line number from the original source code. The output is what is used for `Meta` records.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.getMetaLine(node));
            },
        }),
    ],
};
```
