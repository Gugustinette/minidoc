import type { Node } from "oxc-parser";
import type { InputOptions, OutputOptions } from "rolldown";

export interface Options {
	inputOptions?: InputOptions;
	outputOptions?: OutputOptions;
}

export interface DocumentedItem {
	name: string;
	type: "function" | "class" | "variable" | "method" | "constructor";
	description: string;
	tags: string[];
	filePath: string;
	source: string;
	line: number;
}

export interface CliOptions {
	config?: string;
	input?: string;
	output?: string;
	watch?: boolean;
	verbose?: boolean;
}

export interface Jsdoc {
	description: string;
	tags: Record<string, string[]>;
}

export interface DocumentedNode {
	id: string;
	name: string;
	file: string;
	node: Node;
	jsdoc: Jsdoc;
}
