# getCallExpressionName

```ts
const Meta.getCallExpressionName(node: Node): string;
```

Takes a node and returns the full callee name if it was a call expression - falls back to an empty string.

## Example

```ts
foo();
new Foo();
foo.bar();
```

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                // Prints one of: "", "foo", "Foo", "foo.bar":
                console.log(meta.getCallExpressionName(node));
            },
        }),
    ],
};
```
