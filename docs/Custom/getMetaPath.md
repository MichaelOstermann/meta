### getMetaPath

```ts
function Meta.getMetaPath(): string;
```

Returns the `path` property that is used for `Meta` records.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.getMetaPath());
            },
        }),
    ],
};
```
