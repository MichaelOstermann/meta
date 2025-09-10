# injectHmrSetup

```ts
function Meta.injectHmrSetup(): string;
```

Adds the code necessary for the hot reloading functionality, returns the identifier referencing the `Set<() => void>` that is used for `Meta` records.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                const hmrId = meta.injectHmrSetup("foo");
                meta.injectCode(`console.log(${hmrId});`);
            },
        }),
    ],
};
```

The code that is added, roughly:

```ts
const hmr = import.meta.hot
    ? (import.meta.hot.data["@monstermann/meta"] ??= new Set())
    : undefined;

if (hmr)
    import.meta.hot.dispose(() => {
        for (const cb of hmr) {
            hmr.delete(cb);
            cb();
        }
    });

console.log(hmr);
```
