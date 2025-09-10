# ids

```ts
const Meta.ids: Map<string, string>;
```

A map of identifiers previously generated via [`generateId`](./generateId).

## Example

```ts
const foo = "bar";
```

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                // "foo1", as the identifier "foo" is already present
                // in the original source code above:
                const id = meta.generateId("foo");

                // "foo1"
                meta.ids.get("foo");
            },
        }),
    ],
};
```
