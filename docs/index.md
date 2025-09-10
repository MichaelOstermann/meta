---
aside: true
---

# meta

<Badge type="info" class="size">
    <span>Minified</span>
    <span>562 B</span>
</Badge>

<Badge type="info" class="size">
    <span>Minzipped</span>
    <span>279 B</span>
</Badge>

**Tools to attach metadata to call expressions.**

This is an [unplugin](https://unplugin.unjs.io/) that transforms source code by finding call expressions and decorating them with metadata that can be accessed in their respective function declarations, for the purpose of aiding in debugging or building devtools.

## Example

```ts
import { getMeta } from "@monstermann/meta";
import { signal } from "alien-signals";

function createSignal(value) {
    const s = signal(value);
    // Retrieve information from `createSignal(_)` call sites:
    s.meta = getMeta();
    return s;
}
```

```ts [source.ts]
const count = createSignal(0);

// Prints: { path: "source.ts", line: 1, name: "count" }
console.log(count.meta);
```

### Implicit

The [`wrapWithMeta`](./Presets/wrapWithMeta) preset can be used to implicitly pass metadata as shown above:

```ts [createExample.ts]
import { getMeta } from "@monstermann/meta";
import { signal } from "alien-signals";

function createExample() {
    getMeta();
}
```

```ts [source.ts (Before)]
import { createExample } from "./createExample";
const example = createExample();
```

```ts [source.ts (After)]
import { createExample } from "./createExample";
import { withMeta } from "@monstermann/meta";
const path = "source.ts";
const meta = { path, line: 2, name: "example" };
const example = withMeta(meta, () => createExample());
```

### Explicit

The [`addMetaParam`](./Presets/addMetaParam) and [`setMetaParam`](./Presets/setMetaParam) can be used to explicitly pass `meta` as arguments:

```ts [createExample.ts]
import type { Meta } from "@monstermann/meta";
import { signal } from "alien-signals";

function createExample(meta?: Meta) {}
```

```ts [source.ts (Before)]
import { createExample } from "./createExample";
const example = createExample();
```

```ts [source.ts (After)]
import { createExample } from "./createExample";
const path = "source.ts";
const meta = { path, line: 2, name: "example" };
const example = createExample(meta);
```

### Custom

The plugin also exposes lower level utilities to transform source code on your own, see the [Custom](./Custom/Example) documentation.

## Meta

```ts
interface Meta {
    readonly name: string;
    readonly path: string;
    readonly line: number;
    readonly hmr?: Set<() => void>;
}
```

### name

The plugin will try to extract meaningful identifiers for each decorated call expression, for example:

```ts
// const meta = { name: "count", ... }
const count = createSignal(0);

// const meta = { name: "createCount", ... }
function createCount() {
    return createSignal(0);
}

// const meta = { name: "createState.count", ... }
function createState() {
    return {
        count: createSignal(0),
    };
}
```

### path

The path to the call expression, relative to `process.cwd()`:

```ts [source.ts]
// const meta = { path: "source.ts", ... }
const count = createSignal(0);
```

### line

The line number of the call expression, from the original source code:

```ts [source.ts]
// const meta = { line: 1, ... }
const count = createSignal(0);
```

### hmr

An additional property that is currently only available when using Vite's dev server.

A `Set<() => void>` that can be used to (un)register hot-module-reload callback functions:

```ts [createEventListener.ts]
import { getMeta } from "@monstermann/meta";

export function createEventListener(event, callback) {
    window.addEventListener(event, callback);
    const detach = () => window.removeEventListener(event, callback);
    getMeta().hmr?.add(detach); // [!code highlight]
}
```

```ts [example.ts]
import { createEventListener } from "./createEventListener";

createEventListener("resize", callback);
```

When the above `example.ts` is hot reloaded, the `detach` callback from `createEventListener.ts` will execute.

## Installation

::: code-group

```sh [npm]
npm install @monstermann/meta
npm install -D @monstermann/unplugin-meta
```

```sh [pnpm]
pnpm add @monstermann/meta
pnpm add -D @monstermann/unplugin-meta
```

```sh [yarn]
yarn add @monstermann/meta
yarn add -D @monstermann/unplugin-meta
```

```sh [bun]
bun add @monstermann/meta
bun add -D @monstermann/unplugin-meta
```

:::

## Usage

::: code-group

```ts [Vite]
import meta from "@monstermann/unplugin-meta/vite";

export default defineConfig({
    plugins: [meta(options)],
});
```

```ts [Rollup]
import meta from "@monstermann/unplugin-meta/rollup";

export default {
    plugins: [meta(options)],
};
```

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [meta(options)],
};
```

```ts [Rspack]
module.exports = {
    plugins: [require("@monstermann/unplugin-meta/rspack")(options)],
};
```

```ts [ESBuild]
import { build } from "esbuild";
import meta from "@monstermann/unplugin-meta/esbuild";

build({
    plugins: [meta(options)],
});
```

:::

## Options

```ts
export interface TransformMetaResolver {
    (node: Node, meta: Meta): void;
}

interface MetaPluginOptions {
    resolve: TransformMetaResolver | TransformMetaResolver[];
    hmr?: boolean;
    getName?: (name: string, node: Node, meta: Meta) => string;
    getPath?: (path: string, meta: Meta) => string;
    enforce?: "post" | "pre" | undefined;
    include?: string | string[] | RegExp | RegExp[];
    exclude?: string | string[] | RegExp | RegExp[];
}
```

### resolve

A function that receives every node of a file's AST, as parsed by the [Oxidation Compiler](https://oxc.rs/), and a helper class containing code transformation utilities.

```ts [Rolldown]
import meta, {
    addMetaParam,
    setMetaParam,
    wrapWithMeta,
} from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve: [
                // Use the presets:
                addMetaParam(["foo"]),
                setMetaParam({ bar: 1 }),
                wrapWithMeta(["baz"]),
                // Or do your own code transformations:
                function (node, meta) {},
            ],
        }),
    ],
};
```

### hmr

Enables/disables the [`hmr`](#hmr) property of `Meta` records and its related hot-module-reloading related setup code.

Enabled by default when running Vite's dev server.

### getName

Allows you to transform the `name` property of all `Meta` records.

```ts [source.ts]
const foo = bar();
```

```ts [Rolldown]
import meta, { addMetaParam } from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve: addMetaParam(["foo"]),
            getName: (name) => name.toUpperCase(),
        }),
    ],
};
```

```ts [Output]
const path = "source.ts";
const meta = { path, line: 1, name: "FOO" };
const foo = bar(meta);
```

### getPath

Allows you to transform the `path` property of all `Meta` records.

```ts [source.ts]
const foo = bar();
```

```ts [Rolldown]
import meta, { addMetaParam } from "@monstermann/unplugin-meta/rolldown";

export default {
    plugins: [
        meta({
            resolve: addMetaParam(["foo"]),
            getPath: (path) => `@package/${path}`,
        }),
    ],
};
```

```ts [Output]
const path = "@package/source.ts";
const meta = { path, line: 1, name: "foo" };
const foo = bar(meta);
```

### enforce

Enforces plugin order in [bundlers](https://unplugin.unjs.io/guide/#supported-hooks) that support this option.

### include

Glob(s) or RegExp(s) to specifiy which file paths to include when transforming.

### exclude

Glob(s) or RegExp(s) to specifiy which file paths to exclude when transforming.
