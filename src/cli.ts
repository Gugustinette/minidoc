import process from "node:process";
import { cac } from "cac";
import { type InputOptions, type OutputOptions, rolldown } from "rolldown";
import { version } from "../package.json";
import minidoc from "./rolldown-plugin-minidoc";

const cli = cac("minidoc");
cli.help().version(version);

cli
	.command("[...files]", "Files to document", {
		ignoreOptionDefaultValue: true,
		allowUnknownOptions: true,
	})
	.action(async (input: string[]) => {
		console.log(`minidoc v${version}`);

		const inputOptions: InputOptions = {
			input: input,
			plugins: [minidoc()],
		};

		const outputOptions: OutputOptions = {};

		const bundle = await rolldown(inputOptions);
		await bundle.generate(outputOptions);
		await bundle.close();
	});

async function runCLI(): Promise<void> {
	cli.parse(process.argv, { run: false });

	try {
		await cli.runMatchedCommand();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

await runCLI();
