import type { Node } from "oxc-parser"

export function getNodeName(node: Node, names: string[] = []): void {
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
        names.push(node.id.name)
    }
    else if (node.type === "Property" && node.key.type === "Identifier") {
        names.push(node.key.name)
    }
    else if (node.type === "FunctionDeclaration" && node.id?.type === "Identifier") {
        names.push(node.id.name)
    }
    else if (node.type === "ClassDeclaration" && node.id?.type === "Identifier") {
        names.push(node.id.name)
    }
    else if (node.type === "PropertyDefinition" && node.key.type === "Identifier") {
        names.push(node.key.name)
    }
    else if (node.type === "MethodDefinition" && node.key.type === "Identifier" && node.key.name !== "constructor") {
        names.push(node.key.name)
    }
    else if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
        getNodeName(node.left, names)
    }
    else if (node.type === "MemberExpression") {
        if (node.object.type === "MemberExpression") getNodeName(node.object, names)
        if (node.property.type === "Identifier") names.push(node.property.name)
    }
}
