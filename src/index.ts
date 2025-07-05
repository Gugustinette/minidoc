import { rolldown, watch } from 'rolldown';
import jsdocPlugin from './rolldown-plugin-jsdoc-md';
import { MinidocConfig } from './types';

export async function generateDocs(config: MinidocConfig): Promise<void> {
  console.log('Generating documentation...');

  try {
    const inputOptions = {
      input: Array.isArray(config.input) ? config.input : [config.input],
      plugins: [jsdocPlugin(config)],
      external: () => true, // Treat all imports as external
    };

    const outputOptions = {
      dir: 'temp-build',
      format: config.format || 'es',
    };

    if (config.watch) {
      console.log('Watching for changes...');
      const watcher = watch({ ...inputOptions, output: outputOptions });
      
      watcher.on('event', (event) => {
        switch (event.code) {
          case 'START':
            console.log('Starting build...');
            break;
          case 'END':
            console.log('Build completed');
            break;
          case 'ERROR':
            console.error('Build error:');
            console.error(event.error);
            break;
        }
      });

      // Keep the process running
      process.on('SIGINT', () => {
        watcher.close();
        process.exit(0);
      });
    } else {
      const bundle = await rolldown(inputOptions);
      await bundle.generate(outputOptions);
      await bundle.close();
      console.log('Documentation generated successfully');
    }
  } catch (error) {
    console.error('Error generating documentation:', error);
    throw error;
  }
}

export * from './types';
export * from './config';
