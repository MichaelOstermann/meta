# stringifyMeta

```ts
function stringifyMeta(meta: Meta): string;
```

Takes a `Meta` record and returns a stringified representation of it - useful for logging or error messages.

## Example

```ts
import { stringifyMeta } from "@monstermann/meta";

// example(source.ts:5)
stringifyMeta({ path: "source.ts", line: 5, name: "example" });

// Anonymous(source.ts:5)
stringifyMeta({ path: "source.ts", line: 5, line: 0 });

// Anonymous()
stringifyMeta({ name: "", path: "", line: 0 });

// example()
stringifyMeta({ name: "example", path: "", line: 0 });
```
