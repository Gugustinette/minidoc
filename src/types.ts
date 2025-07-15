import type { Class, MethodDefinition, PropertyDefinition } from "oxc-parser";
import type { InputOptions, OutputOptions } from "rolldown";

export interface Options {
	inputOptions?: InputOptions;
	outputOptions?: OutputOptions;
}

export interface ResolvedOptions {
	inputOptions: InputOptions;
	outputOptions: OutputOptions;
}

export type DocumentableNode = MethodDefinition | PropertyDefinition | Class;
export const DOCUMENTABLE_NODE_TYPES = [
	"MethodDefinition",
	"PropertyDefinition",
	"ClassDeclaration",
	"ClassExpression",
] as const;

export interface Jsdoc {
	description: string;
	tags: Record<string, string[]>;
}

export interface DocumentedNode {
	id: string;
	name: string;
	file: string;
	astNode: DocumentableNode;
	jsdoc: Jsdoc;
}
