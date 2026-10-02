<div align="center">

<h1>meta</h1>

**Metadata about call sites: name, path and line.**

</div>

```ts
interface Meta {
    readonly name: string;
    readonly path: string;
    readonly line: number;
    readonly hmr?: Set<() => void>;
}
```

[`@monstermann/transform-meta`](../transform-meta) creates these records at build time and hands them to the functions you pick, either as an argument or through `withMeta`:

```ts
import { getMeta } from "@monstermann/meta";

function createExample() {
    // { path: "source.ts", line: 3, name: "example" }
    const meta = getMeta();
}
```

```ts [source.ts]
import { createExample } from "./createExample";

const example = createExample();
```

## Installation

```sh
bun add @monstermann/meta
```

## API

| Function              | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `withMeta(meta, fn)`  | Runs `fn`, `meta` is available through `getMeta` while it runs. |
| `getMeta()`           | The current meta, `fallbackMeta` if there is none.              |
| `hasMeta()`           | Whether there is a current meta.                                |
| `getMetaStack()`      | All metas of nested `withMeta` calls.                           |
| `isMeta(value)`       | Whether a value is a `Meta`.                                    |
| `stringifyMeta(meta)` | `"name(path:line)"`                                             |
| `fallbackMeta`        | `{ name: "", path: "", line: 0 }`                               |
