import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseSync } from "oxc-parser";
import { walk } from "oxc-walker";
import type {
	PluginContext,
	RolldownPlugin,
	TransformPluginContext,
	TransformResult,
} from "rolldown";
import { version } from "../package.json";
import {
	DOCUMENTABLE_NODE_TYPES,
	type DocumentableNode,
	type DocumentedNode,
	type ResolvedOptions,
} from "./types";
import { findPrecedingJsdocComment } from "./utils/findPrecedingJsdocComment";
import { generateMarkdown } from "./utils/generateMarkdown";
import { getNodeName } from "./utils/getNodeName";
import { parseJsdocComment } from "./utils/parseJsdocComment";

const documentedNodes: DocumentedNode[] = [];

/**
 * Main Rolldown plugin function
 */
export default function rolldownPluginMinidoc(
	options: ResolvedOptions,
): RolldownPlugin {
	return {
		name: "minidoc",

		buildStart(this: PluginContext): void {
			this.debug(`minidoc v${version}`);
			this.info("Starting documentation collection...");
		},

		transform: {
			handler(
				this: TransformPluginContext,
				code: string,
				id: string,
			): TransformResult {
				try {
					// Parse the source code
					const parseResult = parseSync(id, code, {
						sourceType: "module",
						range: true,
					});

					// Filter JSDoc comments
					const jsdocComments = parseResult.comments.filter(
						(comment) => comment.type === "Block",
					);

					if (jsdocComments.length === 0) {
						return null;
					}

					walk(parseResult.program, {
						enter: (untypedNode) => {
							// Check if the node is a function, class, or variable declaration
							// biome-ignore lint/suspicious/noExplicitAny: Allow any type for node
							if (!DOCUMENTABLE_NODE_TYPES.includes(untypedNode.type as any)) {
								return null;
							}

							// Re-cast to filtered types
							const node: DocumentableNode = untypedNode as DocumentableNode;
							const nodeName: string = getNodeName(node);

							// Find corresponding JSDoc comment
							const precedingJsdocComment = findPrecedingJsdocComment(
								node,
								jsdocComments,
							);

							// If a JSDoc comment is found, parse it and create a documented node
							if (precedingJsdocComment) {
								const jsdoc = parseJsdocComment(precedingJsdocComment.value);
								documentedNodes.push({
									id: `${id}:${nodeName}:${node.start}:${node.end}`,
									name: nodeName,
									file: id,
									astNode: node,
									jsdoc,
								});

								// Remove the comment from the list to avoid duplicates
								const index = jsdocComments.indexOf(precedingJsdocComment);
								if (index !== -1) {
									jsdocComments.splice(index, 1);
								}
							}
						},
					});

					if (documentedNodes.length > 0) {
						this.debug(
							`minidoc: Found ${documentedNodes.length} documented nodes in ${id}`,
						);
					}
				} catch (error) {
					this.warn(`minidoc: Failed to parse ${id}:`, error.message);
				}
				return null;
			},
		},

		generateBundle(this: PluginContext): void {
			this.info(
				`Generating documentation with ${documentedNodes.length} entries...`,
			);

			// Generate markdown
			const markdown = generateMarkdown(documentedNodes, options);

			// Ensure output directory exists
			const outputPath = path.resolve("docs", "index.md");
			const outputDir = path.dirname(outputPath);

			try {
				mkdirSync(outputDir, { recursive: true });
			} catch (err) {
				this.error(
					`Failed to create output directory ${outputDir}: ${err.message}`,
				);
				return;
			}

			// Write documentation file
			writeFileSync(outputPath, markdown, "utf8");
			this.info(`minidoc: Documentation generated at ${outputPath}`);
		},
	};
}
