# setMetaParam

A preset that can be used to find call expressions such as `foo()`, `new Foo()`, or `foo.bar.baz()` and add `meta` as an argument at a specific parameter offset, filling any missing ones with `undefined`:

```ts [source.ts]
import type { Meta } from "@monstermann/meta";

function runExample(options?: RunExampleOptions, meta?: Meta) {
    // { path: "source.ts", line: 8, name: "example" }
    console.log(meta);
}

const example = runExample();
```

```ts [Rolldown]
import meta, { setMetaParam } from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve: setMetaParam({
                runExample: 2,
            }),
        }),
    ],
};
```

```ts [Output]
const path = "source.ts"; // [!code ++]
const meta = { path, line: 8, name: "example" }; // [!code ++]

function runExample(options?: RunExampleOptions, meta?: Meta) {
    // { path: "source.ts", line: 8, name: "example" }
    console.log(meta);
}

const example = runExample(); // [!code --]
const example = runExample(undefined, meta); // [!code ++]
```
