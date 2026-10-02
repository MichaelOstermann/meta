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

`params` picks the functions that receive metadata, by the module they are imported from, and the position of the argument (starting at `1`):

```ts
import { meta } from "@monstermann/meta";

export default defineConfig({
    plugins: [
        meta({
            params: {
                // signal(0) → signal(0, meta)
                // effect(fn) → effect(fn, undefined, meta)
                signals: { signal: 2, effect: 3 },
                tracer: { trace: 2 },
            },
        }),
    ],
});
```

- Works with Vite, Rolldown and tsdown.
- Renamed imports (`import { signal as s }`) and namespace imports (`import * as S`) are found, functions that only share the name are left alone.
- Names are relative to the module: `"signal"`, `"Foo.bar"` for `Foo.bar()`, `"default.bar"` for members of the default export.
- Calls are skipped when the argument is already taken, or when its position is unknown because of spread arguments.

### Standalone

```ts
import { transform } from "@monstermann/meta";

const result = transform(code, "source.ts", {
    params: { signals: { signal: 2 } },
});
result?.code;
result?.map;
```

## Options

| Option    | Default        | Description                                                                         |
| --------- | -------------- | ----------------------------------------------------------------------------------- |
| `params`  |                | See above.                                                                          |
| `getName` |                | `(name) => string`, changes the name of a record.                                   |
| `getPath` |                | `(path) => string`, changes the path, which is relative to `process.cwd()`.         |
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
