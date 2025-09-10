# injectCode

```ts
function Meta.injectCode(code: string): void;
```

Takes a piece of code and appends it after all import declarations.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                meta.injectCode(`console.log("Hello world!");`);
            },
        }),
    ],
};
```
