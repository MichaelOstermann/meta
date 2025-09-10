# addMetaParam

A preset that can be used to find call expressions such as `foo()`, `new Foo()`, or `foo.bar.baz()` and append `meta` as an argument:

```ts [source.ts]
import type { Meta } from "@monstermann/meta";

function runExample(meta?: Meta) {
    // { path: "source.ts", line: 8, name: "example" }
    console.log(meta);
}

const example = runExample();
```

```ts [Rolldown]
import meta, { addMetaParam } from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve: addMetaParam(["runExample"]),
        }),
    ],
};
```

```ts [Output]
const path = "source.ts"; // [!code ++]
const meta = { path, line: 8, name: "example" }; // [!code ++]

function runExample(meta?: Meta) {
    // { path: "source.ts", line: 8, name: "example" }
    console.log(meta);
}

const example = runExample(); // [!code --]
const example = runExample(meta); // [!code ++]
```
