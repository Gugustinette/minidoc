import type { Jsdoc } from "../types";

/**
 * Utility to parse JSDoc comments into structured data
 */
export function parseJsdocComment(commentText: string): Jsdoc {
	// Remove every ' * ' from the start of each line
	const cleanedText = commentText
		.split("\n")
		.map((line) => line.replace(/^\s*\*\s?/, ""))
		.join("\n");

	// Description is everything before the first tag
	const descriptionMatch = cleanedText.match(/^(.*?)(\n\s*@|$)/s);
	const description = descriptionMatch ? descriptionMatch[1].trim() : "";

	// Extract tags and parameters
	const tags: Record<string, string[]> = {};
	const tagRegex = /@(\w+)(?:\s+([^\n]+))?/g;
	let match: string[] | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: Using regex to parse tags
	while ((match = tagRegex.exec(cleanedText)) !== null) {
		const tagName = match[1];
		const tagValue = match[2] ? match[2].trim() : "";

		if (!tags[tagName]) {
			tags[tagName] = [];
		}

		// Handle special case for @param
		if (tagName === "param") {
			// Split by spaces, but keep type annotations
			const paramParts = tagValue.split(/\s+/);
			const paramType = paramParts.shift();
			const paramName = paramParts.shift();
			const paramDescription = paramParts.join(" ");
			tags[tagName].push(`${paramType} ${paramName} - ${paramDescription}`);
		} else {
			tags[tagName].push(tagValue);
		}
	}
	// Handle returns tag
	if (tags.returns || tags.return) {
		const returns = tags.returns || tags.return;
		if (returns.length > 0) {
			tags.returns = returns.map((ret) => {
				// Split by spaces, but keep type annotations
				const parts = ret.split(/\s+/);
				const type = parts.shift();
				const description = parts.join(" ");
				return `${type} - ${description}`;
			});
		}
	}
	// Handle example tag
	if (tags.example) {
		tags.example = tags.example.map((example) => {
			// Remove leading/trailing whitespace and backticks
			return example.trim().replace(/^`+|`+$/g, "");
		});
	}
	// Handle other tags
	const otherTags = ["throws", "see", "since", "deprecated", "author"];
	for (const tag of otherTags) {
		if (tags[tag]) {
			tags[tag] = tags[tag].map((value) => value.trim());
		}
	}
	return {
		description,
		tags: tags,
	};
}
