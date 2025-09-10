# isMeta

```ts
function isMeta(value: unknown): value is Meta;
```

Returns a boolean indicating whether the provided `value` is a `Meta` record.

## Example

```ts
import { isMeta } from "@monstermann/meta";

isMeta(null); // false
isMeta({ path: "", line: 0, name: "" }); // true
```
