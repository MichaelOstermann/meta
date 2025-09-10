# code

```ts
const Meta.code: string;
```

The original source code of the file currently being transformed.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.code);
            },
        }),
    ],
};
```
