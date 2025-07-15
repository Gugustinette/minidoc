import type { BindingIdentifier, IdentifierName } from "oxc-parser";
import type { DocumentableNode } from "../types";

/**
 * Return the name for a given node.
 */
export function getNodeName(node: DocumentableNode): string {
	const identifier = getNodeIdentifier(node);
	return identifier?.name ?? "Unnamed";
}

function getNodeIdentifier(
	node: DocumentableNode,
): BindingIdentifier | IdentifierName | null {
	// Handle class declarations and expressions
	if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
		return node.id;
	}

	// Handle nodes with key property (methods, properties, etc.)
	if ("key" in node && node.key) {
		return node.key as IdentifierName;
	}

	// Handle nodes with id property
	if ("id" in node && node.id) {
		return node.id as BindingIdentifier;
	}

	return null;
}
