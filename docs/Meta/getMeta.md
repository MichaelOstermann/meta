# getMeta

```ts
function getMeta(): Meta;
```

Retrieves the `Meta` record for the current execution context, otherwise returns [`fallbackMeta`](./fallbackMeta) if unavailable.

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
