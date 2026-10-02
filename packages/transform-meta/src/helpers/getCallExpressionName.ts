import type { MemberExpression, Node } from "oxc-parser"

export function getCallExpressionName(node: Node): string {
    return getCallExpressionIdentifiers(node).join(".")
}

/** `foo.bar.baz()` → `["foo", "bar", "baz"]` */
export function getCallExpressionIdentifiers(node: Node): string[] {
    if (node.type !== "CallExpression" && node.type !== "NewExpression") return []
    if (node.callee.type === "Identifier") return [node.callee.name]
    if (node.callee.type === "MemberExpression") return getMemberExpressionIdentifiers(node.callee)
    return []
}

function getMemberExpressionIdentifiers(node: MemberExpression): string[] {
    if (node.computed || node.property.type !== "Identifier") return []
    if (node.object.type === "Identifier") return [node.object.name, node.property.name]
    if (node.object.type !== "MemberExpression") return []
    const identifiers = getMemberExpressionIdentifiers(node.object)
    return identifiers.length ? [...identifiers, node.property.name] : []
}
