import type { DocumentedNode, Options } from "../types";
import { generateEntryMarkdown } from "./generateEntryMarkdown";

/**
 * Generate Markdown documentation from collected JSDoc entries
 */
export function generateMarkdown(
	documentedNodes: DocumentedNode[],
	_options: Options = {},
): string {
	let markdown = `# Title\n\n`;
	const groupByType = true;

	if (documentedNodes.length === 0) {
		markdown += "_No documented functions or classes found._\n";
		return markdown;
	}

	// Group by type if requested
	if (groupByType) {
		const grouped = documentedNodes.reduce((acc, entry) => {
			const type = entry.astNode.type;
			if (!acc[type]) acc[type] = [];
			acc[type].push(entry);
			return acc;
		}, {});

		const typeHeaders = {
			MethodDefinition: "## Functions",
			PropertyDefinition: "## Properties",
			ClassDeclaration: "## Classes",
			ClassExpression: "## Classes",
		};

		for (const type of Object.keys(grouped)) {
			if (grouped[type]) {
				markdown += `${typeHeaders[type] || `## ${type}s`}\n\n`;
				for (const entry of grouped[type]) {
					markdown += generateEntryMarkdown(entry);
				}
			}
		}
	} else {
		// Generate entries in order
		for (const entry of documentedNodes) {
			markdown += generateEntryMarkdown(entry);
		}
	}

	return markdown;
}
