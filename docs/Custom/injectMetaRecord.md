# injectMetaRecord

```ts
function Meta.injectMetaRecord({ line, name, path }: {
    line: number;
    name: string;
    path: string;
}): string;
```

Injects `const ${meta.generateId("meta")} = { path: ${meta.injectPath(path)}, line: ${line}, name: "${name}" }` into the source code and returns the generated identifier.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                // Example code added:
                // const path2 = "foo";
                // const meta2 = { path: path2, line: 2, name: "bar" };
                // console.log(meta2);
                const metaId = meta.injectMetaRecord({
                    path: "foo",
                    line: 2,
                    name: "bar",
                });
                meta.injectCode(`console.log(${metaId});`);
            },
        }),
    ],
};
```
