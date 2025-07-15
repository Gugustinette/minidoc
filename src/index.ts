import { rolldown } from "rolldown";
import { version } from "../package.json";
import { resolveOptions } from "./config";
import rolldownPluginMinidoc from "./rolldown-plugin-minidoc";
import type { Options } from "./types";

/**
 * Generates documentation for a project using Rolldown and the minidoc plugin.
 * @param options The options for the minidoc generation.
 * @returns A promise that resolves when the documentation generation is complete.
 */
export async function minidoc(options: Options): Promise<void> {
	console.log(`minidoc v${version}`);

	// Resolve options
	const resolvedOptions = resolveOptions(options);

	// Run Rolldown with the resolved options
	const bundle = await rolldown(resolvedOptions.inputOptions);
	await bundle.generate(resolvedOptions.outputOptions);
	await bundle.close();
}

export { rolldownPluginMinidoc };
