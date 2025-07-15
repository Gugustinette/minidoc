import process from "node:process";
import { cac } from "cac";
import { version } from "../package.json";
import { minidoc } from ".";

const cli = cac("minidoc");
cli.help().version(version);

cli
	.command("[...files]", "Files to document", {
		ignoreOptionDefaultValue: true,
		allowUnknownOptions: true,
	})
	.action(async (input: string[]) => {
		await minidoc({
			inputOptions: {
				input,
			},
		});
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
