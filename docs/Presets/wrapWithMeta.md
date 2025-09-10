# wrapWithMeta

A preset that can be used to find call expressions such as `foo()`, `new Foo()`, or `foo.bar.baz()` and wrap them using [`withMeta`](../meta/withMeta).

```ts [source.ts]
import { getMeta } from "@monstermann/meta";

function runExample() {
    const meta = getMeta();
    // { path: "source.ts", line: 9, name: "example" }
    console.log(meta);
}

const example = runExample();
```

```ts [Rolldown]
import meta, { wrapWithMeta } from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve: wrapWithMeta(["runExample"]),
        }),
    ],
};
```

```ts [Output]
import { getMeta } from "@monstermann/meta";
import { withMeta } from "@monstermann/meta"; // [!code ++]
const path = "source.ts"; // [!code ++]
const meta = { path, line: 9, name: "example" }; // [!code ++]

function runExample() {
    const meta = getMeta();
    // { path: "source.ts", line: 10, name: "example" }
    console.log(meta);
}

const example = runExample(); // [!code --]
const example = withMeta(meta, () => runExample()); // [!code ++]
```
