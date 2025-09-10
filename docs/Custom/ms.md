# ms

```ts
const Meta.ms: MagicString;
```

An instance of [Rich-Harris/magic-string](https://github.com/Rich-Harris/magic-string). This is used to manipulate the original source code.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                meta.ms.append(`console.log("Hello world!")`);
            },
        }),
    ],
};
```
