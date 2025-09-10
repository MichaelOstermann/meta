# ast

```ts
const Meta.ast: Program;
```

The AST of the source code being transformed, as parsed by the [Oxidation Compiler](https://oxc.rs/).

It can be traversed using [oxc-walker](https://github.com/oxc-project/oxc-walker).

## Example

```ts [Rolldown]
import meta from "@monstermann/unplugin-meta/rolldown";
import { walk } from "oxc-walker";

export default {
    plugins: [
        meta({
            resolve(node, meta) {
                walk(meta.ast, {
                    enter(node) {},
                    leave(node) {},
                });
            },
        }),
    ],
};
```
