# filePath

```ts
const Meta.filePath: string;
```

The file path of the source code being transformed.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.filePath);
            },
        }),
    ],
};
```
