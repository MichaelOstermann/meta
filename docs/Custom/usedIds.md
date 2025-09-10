# usedIds

```ts
const Meta.usedIds: Set<string>;
```

A set of identifiers that are either present in the source code, or generated on the fly via [`generateId`](./generateId).

If you would like to for example introduce new variables to the source code, make sure to not give it a name that is already included in this set.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                console.log(meta.usedIds);
            },
        }),
    ],
};
```
