# generateId

```ts
function Meta.generateId(name: string): string;
```

Takes a string and returns a unique identifier that is safe to inject into the current file.

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                meta.generateId("foo"); // "foo"
                meta.generateId("foo"); // "foo1"
                meta.generateId("foo"); // "foo2"
            },
        }),
    ],
};
```
