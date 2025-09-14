# getMetaStack

```ts
function getMetaStack(): (Meta | undefined)[];
```

Retrieves the list of `Meta` records currently defined.

## Example

```ts
import { withMeta, getMetaStack } from "@monstermann/meta";

const metaA = { path, line, name };
const metaB = { path, line, name };
const metaC = { path, line, name };

function exampleA() {
    withMeta(metaB, exampleB);
}

function exampleB() {
    withMeta(metaC, exampleC);
}

function exampleC() {
    console.log(getMetaStack());
}

// Prints: [metaA, metaB, metaC]
withMeta(metaA, exampleA);
```
