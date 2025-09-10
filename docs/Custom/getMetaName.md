### getMetaName

```ts
function Meta.getMetaName(node: Node): string;
```

Takes a node and returns the `name` property that is used for `Meta` records.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.getMetaName(node));
            },
        }),
    ],
};
```
