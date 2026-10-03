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

## Installation

```sh
bun add -D @monstermann/meta
```

## Usage

`params` lists the functions that receive metadata, and what each of them receives:

```ts
import { meta } from "@monstermann/meta";

export default defineConfig({
    plugins: [
        meta({
            params: [
                {
                    module: "signals",
                    function: "signal",
                    position: 2,
                    // signal(0) → signal(0, { path: "source.ts", line: 3, name: "count" })
                    meta: ({ path, line, name }) => ({ path, line, name }),
                },
                {
                    module: "logger",
                    function: "log",
                    position: 2,
                    // log("Hello") → log("Hello", { at: "source.ts:5" })
                    meta: ({ path, line }) => ({ at: `${path}:${line}` }),
                },
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
| `meta`     | Returns what the call receives, a record of strings, numbers, booleans or `null`.                                               |

`meta` is called with what is known about the call:

| Property | Description                                                                      |
| -------- | -------------------------------------------------------------------------------- |
| `path`   | The path of the module, relative to `process.cwd()`.                             |
| `line`   | The line of the call.                                                            |
| `name`   | Taken from what the result is assigned to, see [Names](#names).                  |
| `hmr`    | Return it to receive callbacks for when the module is replaced, see [HMR](#hmr). |

- Works with Vite, Rolldown and tsdown.
- With a `module`, renamed imports (`import { signal as s }`) and namespace imports (`import * as S`) are found, and functions that only share the name are left alone.
- Calls are skipped when the argument is already taken, when its position is unknown because of spread arguments, or when the record is empty.
- Calls that receive the same share one record.

### Namespaces and classes

`function` follows the members of what is being called:

```ts
const meta = ({ name }) => ({ name });

meta({
    params: [
        // Rect.create(0, 0) → Rect.create(0, 0, meta)
        { module: "geometry", function: "Rect.create", position: 3, meta },
        // new Store() → new Store(meta)
        { module: "stores", function: "Store", position: 1, meta },
        // Store.from(items) → Store.from(items, meta)
        { module: "stores", function: "Store.from", position: 2, meta },
        // Your own functions, wherever they are imported from or declared:
        // createThing() → createThing(meta)
        { function: "createThing", position: 1, meta },
    ],
});
```

- Methods of instances can only be matched by the name of the variable (`"store.add"` for `store.add()`), and `this.foo()` not at all.
- Run this plugin before anything that rewrites the calls, such as [`@monstermann/barrels-treeshake`](https://github.com/MichaelOstermann/barrels) turning `Rect.create()` into `_create()`.

### Standalone

```ts
import { transform } from "@monstermann/meta";

const result = transform(code, "source.ts", {
    params: [
        {
            module: "signals",
            function: "signal",
            position: 2,
            meta: ({ name }) => ({ name }),
        },
    ],
});
result?.code;
result?.map;
```

## Options

| Option    | Default        | Description                                                            |
| --------- | -------------- | ---------------------------------------------------------------------- |
| `params`  |                | See above.                                                             |
| `hmr`     | `false`        | See [HMR](#hmr).                                                       |
| `include` | `/\.[jt]sx?$/` | Plugin only: RegExp(s), only files whose path matches are transformed. |
| `exclude` |                | Plugin only: RegExp(s), files whose path matches are skipped.          |
| `enforce` |                | Plugin only: `"pre"` or `"post"`.                                      |

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

When a module is replaced during development, whatever its previous version created keeps running: effects, subscriptions, timers. A param that returns `hmr` receives a `Set` of callbacks that is shared by all calls of the module. The callbacks are called and removed right before the module runs again, and when it is removed.

```ts
meta({
    params: [
        {
            module: "effects",
            function: "effect",
            position: 2,
            // effect(fn) → effect(fn, { hmr: hmr })
            meta: ({ hmr }) => ({ hmr }),
        },
    ],
});
```

The function that receives it registers its cleanup:

```ts
import type { MetaHmr } from "@monstermann/meta";

export function effect(fn: () => void, meta?: { hmr?: MetaHmr }) {
    const dispose = start(fn);
    meta?.hmr?.add(dispose);
    return dispose;
}
```

What the transform adds to a module:

```ts
import { effect } from "effects";
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
const meta = { hmr: hmr };

effect(() => console.log("example"), meta);
```

- The plugin enables the `hmr` option by default in the dev server of Vite, and leaves it off for builds.
- While the option is off, `hmr` is left out of the records. A call whose record only consists of it is then left alone.
- It relies on `import.meta.hot`, without it `hmr` is `undefined`.
- Remove a callback from the set when the cleanup already happened, to not keep it around until the next update.
