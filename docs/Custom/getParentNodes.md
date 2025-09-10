# getParentNodes

```ts
function Meta.getParentNodes(node: Node): Node[];
```

Takes a node and returns a list of all parent nodes, in order of occurrence.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.getParentNodes(node));
            },
        }),
    ],
};
```
