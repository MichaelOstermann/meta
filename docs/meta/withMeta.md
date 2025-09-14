# withMeta

```ts
function withMeta(meta: Meta | undefined, fn: () => T): T;
```

Executes `fn` with the provided `meta` context.

## Example

```ts
import { getMeta, withMeta } from "@monstermann/meta";

function example() {
    console.log(getMeta());
}

const meta = { path, line, name };

// Prints: meta
withMeta(meta, example);

// Prints: fallbackMeta
example();
```
