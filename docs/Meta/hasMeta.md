# hasMeta

```ts
function hasMeta(): boolean;
```

Returns a boolean indicating whether the current execution context has `Meta` defined.

## Example

```ts
import { hasMeta, withMeta } from "@monstermann/meta";

function example() {
    console.log(hasMeta());
}

const meta = { path, line, name };

// Prints: true
withMeta(meta, example);

// Prints: false
example();
```
