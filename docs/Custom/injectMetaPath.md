# injectMetaPath

```ts
function Meta.injectMetaPath(path: string): string;
```

Injects `const ${meta.generateId("path")} = "${path}";` into the source code and returns the generated identifier, or an existing one if the path has already been injected.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                // Example code added:
                // const path2 = "foo";
                // console.log(path2);
                const pathId = meta.injectMetaPath("foo");
                meta.injectCode(`console.log(${pathId});`);
            },
        }),
    ],
};
```
