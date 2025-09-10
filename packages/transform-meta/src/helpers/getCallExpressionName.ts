import type { MemberExpression, Node } from "oxc-parser"

export function getCallExpressionName(node: Node): string {
    if (node.type === "NewExpression" && node.callee.type === "Identifier") return node.callee.name
    if (node.type !== "CallExpression") return ""
    if (node.callee.type === "Identifier") return node.callee.name
    if (node.callee.type === "MemberExpression") return stringifyMemberExpression(node.callee)
    return ""
}

function stringifyMemberExpression(node: MemberExpression): string {
    return getMemberExpressionIdentifiers(node)
        .filter(Boolean)
        .join(".")
}

function getMemberExpressionIdentifiers(node: MemberExpression): string[] {
    if (node.property.type !== "Identifier") return []
    if (node.object.type === "Identifier") return [node.object.name, node.property.name]
    if (node.object.type === "MemberExpression") {
        return [...getMemberExpressionIdentifiers(node.object), node.property.name]
    }
    return []
}
