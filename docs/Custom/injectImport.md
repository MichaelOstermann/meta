# injectImport

```ts
function Meta.injectImport(code: string): void;
```

Similar to [`injectCode`](./injectCode), but the code is prepended after all import declarations - intended to add new imports to the source code.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                meta.injectImport(`console.log("Hello world!");`);
            },
        }),
    ],
};
```
