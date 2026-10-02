<div align="center">

<h1>meta</h1>

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

```ts
interface Meta {
    readonly name: string;
    readonly path: string;
    readonly line: number;
    readonly hmr?: Set<() => void>;
}
```

## Installation

```sh
bun add -D @monstermann/meta
```

## Usage

`params` lists the functions that receive metadata:

```ts
import { meta } from "@monstermann/meta";

export default defineConfig({
    plugins: [
        meta({
            params: [
                // signal(0) → signal(0, meta)
                { module: "signals", function: "signal", position: 2 },
                // effect(fn) → effect(fn, undefined, meta)
                { module: "signals", function: "effect", position: 3 },
            ],
        }),
    ],
});
```

| Property   | Description                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `module`   | The module the function is imported from. Optional, without it everything that is called by that name is matched.               |
| `function` | Its name as exported by the module: `"signal"`, `"Foo.bar"` for `Foo.bar()`, `"default.bar"` for members of the default export. |
| `position` | The position of the argument, starting at `1`. Missing arguments in between are filled with `undefined`.                        |

- Works with Vite, Rolldown and tsdown.
- With a `module`, renamed imports (`import { signal as s }`) and namespace imports (`import * as S`) are found, and functions that only share the name are left alone.
- Calls are skipped when the argument is already taken, or when its position is unknown because of spread arguments.

### Namespaces and classes

`function` follows the members of what is being called:

```ts
meta({
    params: [
        // Rect.create(0, 0) → Rect.create(0, 0, meta)
        { module: "geometry", function: "Rect.create", position: 3 },
        // new Store() → new Store(meta)
        { module: "stores", function: "Store", position: 1 },
        // Store.from(items) → Store.from(items, meta)
        { module: "stores", function: "Store.from", position: 2 },
        // Your own functions, wherever they are imported from or declared:
        // createThing() → createThing(meta)
        { function: "createThing", position: 1 },
    ],
});
```

- Methods of instances can only be matched by the name of the variable (`"store.add"` for `store.add()`), and `this.foo()` not at all.
- Run this plugin before anything that rewrites the calls, such as [`@monstermann/barrels-treeshake`](https://github.com/MichaelOstermann/barrels) turning `Rect.create()` into `_create()`.

### Standalone

```ts
import { transform } from "@monstermann/meta";

const result = transform(code, "source.ts", {
    params: [{ module: "signals", function: "signal", position: 2 }],
});
result?.code;
result?.map;
```

## Options

| Option    | Default        | Description                                                                 |
| --------- | -------------- | --------------------------------------------------------------------------- |
| `params`  |                | See above.                                                                  |
| `getName` |                | `(name) => string`, changes the name of a record.                           |
| `getPath` |                | `(path) => string`, changes the path, which is relative to `process.cwd()`. |
| `hmr`     | `false`        | See [HMR](#hmr).                                                            |
| `include` | `/\.[jt]sx?$/` | Plugin only: RegExp(s), only files whose path matches are transformed.      |
| `exclude` |                | Plugin only: RegExp(s), files whose path matches are skipped.               |
| `enforce` |                | Plugin only: `"pre"` or `"post"`.                                           |

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

## HMR

When a module is replaced during development, whatever its previous version created keeps running: effects, subscriptions, timers. With `hmr`, each record carries a `Set` of callbacks that is shared by all records of the module. The callbacks are called and removed right before the module runs again, and when it is removed.

The function that receives the metadata registers its cleanup:

```ts
import type { Meta } from "@monstermann/meta";

export function effect(fn: () => void, meta?: Meta) {
    const dispose = start(fn);
    meta?.hmr?.add(dispose);
    return dispose;
}
```

What the transform adds to a module:

```ts
import { effect } from "effects";
const path = "source.ts";
const hmr = import.meta.hot
    ? (import.meta.hot.data["@monstermann/meta"] ??= new globalThis.Set())
    : undefined;
if (hmr) {
    const clear = () => {
        for (const cb of hmr) {
            hmr.delete(cb);
            cb();
        }
    };
    clear();
    import.meta.hot.dispose(clear);
    import.meta.hot.prune(clear);
}
const meta = { path: path, line: 3, name: "", hmr: hmr };

effect(() => console.log("example"), meta);
```

- The plugin enables `hmr` by default in the dev server of Vite, and leaves it off for builds.
- It relies on `import.meta.hot`, without it `meta.hmr` is `undefined`.
- Remove a callback from the set when the cleanup already happened, to not keep it around until the next update.
