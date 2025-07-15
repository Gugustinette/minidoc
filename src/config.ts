import type { InputOptions, OutputOptions } from "rolldown";
import rolldownPluginMinidoc from "./rolldown-plugin-minidoc";
import type { Options, ResolvedOptions } from "./types";

export const DEFAULT_CONFIG: Options = {
	inputOptions: {
		input: "src/index.ts",
	},
	outputOptions: {
		dir: "minidoc",
	},
};

export function resolveOptions(options: Options = {}): ResolvedOptions {
	// Resolved Rolldown options
	const inputOptions: InputOptions = {
		...DEFAULT_CONFIG.inputOptions,
		...options.inputOptions,
	};
	const outputOptions: OutputOptions = {
		...DEFAULT_CONFIG.outputOptions,
		...options.outputOptions,
	};

	// Create the resolved options object
	const resolvedOptions: ResolvedOptions = {
		inputOptions,
		outputOptions,
	};

	// Add the minidoc plugin to the input options
	// This is made after every other resolution to guarantee options are resolved for the plugin
	inputOptions.plugins = [
		...(Array.isArray(options.inputOptions?.plugins)
			? options.inputOptions.plugins
			: []),
		rolldownPluginMinidoc(resolvedOptions),
	];

	// Return the resolved options
	return resolvedOptions;
}
