# injectMetaImport

```ts
function Meta.injectMetaImport(name: string): string;
```

Injects `import { ${name} as ${meta.generateId(name)} } from "@monstermann/meta";` into the source code, returns the generated identifier, or an existing one if this module has already been imported.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                // Example code added:
                // import { foo as foo2 } from "@monstermann/meta";
                // console.log(foo2);
                const importId = meta.injectMetaImport("foo");
                meta.injectCode(`console.log(${importId});`);
            },
        }),
    ],
};
```
