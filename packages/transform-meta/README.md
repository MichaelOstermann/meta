<div align="center">

<h1>transform-meta</h1>

**Attaches metadata about call sites to the functions that are being called.**

</div>

Before:

```ts
import { signal } from "signals";

const count = signal(0);
```

After:

```ts
import { signal } from "signals";
const path = "source.ts";
const meta = { path: path, line: 3, name: "count" };

const count = signal(0, meta);
```

## Installation

```sh
bun add -D @monstermann/transform-meta
```

## Usage

Resolvers decide which calls receive metadata and how. The three presets match functions by the module they have been imported from, so renamed imports (`import { signal as s }`) and namespace imports (`import * as S`) are found, while functions that only share the name are left alone.

```ts
import {
    addMetaParam,
    setMetaParam,
    wrapWithMeta,
} from "@monstermann/transform-meta";

// signal(0) → signal(0, meta), unless the second argument is taken
// effect(fn) → effect(fn, undefined, meta), missing arguments are filled with undefined
setMetaParam("signals", { signal: 2, effect: 3 });

// signal(0) → signal(0, meta)
addMetaParam("signals", ["signal"]);

// signal(0) → withMeta(meta, () => signal(0)), read it with getMeta() from @monstermann/meta
wrapWithMeta("signals", ["signal"]);
```

`resolve` takes a list, to cover functions from several modules:

```ts
transformMeta(code, "source.ts", {
    resolve: [
        setMetaParam("signals", { signal: 2 }),
        setMetaParam("tracer", { trace: 2 }),
    ],
});
```

Names are relative to the module: `"signal"`, `"Foo.bar"` for `Foo.bar()`, `"default.bar"` for members of the default export.

### Vite, Rolldown, tsdown

```ts
import { metaPlugin, setMetaParam } from "@monstermann/transform-meta";

export default defineConfig({
    plugins: [metaPlugin({ resolve: setMetaParam("signals", { signal: 2 }) })],
});
```

### Standalone

```ts
import { setMetaParam, transformMeta } from "@monstermann/transform-meta";

const result = transformMeta(code, "source.ts", {
    resolve: setMetaParam("signals", { signal: 2 }),
});
result?.code;
result?.map;
```

## Options

| Option    | Default        | Description                                                                         |
| --------- | -------------- | ----------------------------------------------------------------------------------- |
| `resolve` |                | A resolver, or a list of them.                                                      |
| `getName` |                | `(name, node, meta) => string`, changes the name of a record.                       |
| `getPath` |                | `(path, meta) => string`, changes the path, which is relative to `process.cwd()`.   |
| `hmr`     | `false`        | Adds a `Set` to each record that is called and cleared when the module is replaced. |
| `include` | `/\.[jt]sx?$/` | Plugin only: RegExp(s), only files whose path matches are transformed.              |
| `exclude` |                | Plugin only: RegExp(s), files whose path matches are skipped.                       |
| `enforce` |                | Plugin only: `"pre"` or `"post"`.                                                   |

The plugin enables `hmr` by default when it runs in the dev server of Vite.

## Names

The name of a record is taken from what the result is assigned to:

```ts
// "count"
const count = signal(0);

// "createCount"
function createCount() {
    return signal(0);
}

// "state.count"
const state = {
    count: signal(0),
};
```

## Custom resolvers

A resolver is called with every node and a `Meta` instance:

```ts
import type { TransformMetaResolver } from "@monstermann/transform-meta";

const resolver: TransformMetaResolver = function (node, meta) {
    if (meta.getImportedCallExpressionName(node, "signals") !== "signal")
        return;
    const id = meta.injectMetaRecord({
        line: meta.getMetaLine(node),
        name: meta.getMetaName(node),
        path: meta.getMetaPath(),
    });
    meta.injectMetaParam(node, id);
};
```
