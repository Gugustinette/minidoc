import { loadConfigSync } from 'unconfig';
import path from 'node:path';
import { MinidocConfig } from './types';

const DEFAULT_CONFIG: MinidocConfig = {
  input: 'src',
  outputDir: 'docs/api',
  include: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
  exclude: [
    'node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts',
    '**/dist/**',
    '**/build/**',
  ],
  title: 'API Documentation',
  format: 'es',
  parserOptions: {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties',
      'objectRestSpread',
      'asyncGenerators',
      'functionBind',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining',
    ],
  },
};

const moduleName = 'minidoc';

export function loadConfig(configPath?: string): MinidocConfig {
  const config = loadConfigSync<MinidocConfig>({
    sources: [
      {
        files: `${moduleName}.config`,
        extensions: ['js', 'ts', 'json'],
      },
      {
        files: path.join(process.cwd(), 'minidoc.config'),
        extensions: ['js', 'ts', 'json'],
      },
    ],
    defaults: DEFAULT_CONFIG,
  });

  if (configPath) {
    const customConfig = require(configPath);
    return { ...config, ...customConfig };
  }

  return config.config || DEFAULT_CONFIG;
}

export function validateConfig(config: MinidocConfig): void {
  if (!config.input) {
    throw new Error('Input is required');
  }

  if (!config.outputDir) {
    throw new Error('Output directory is required');
  }

  if (!Array.isArray(config.include) || config.include.length === 0) {
    throw new Error('Include patterns must be a non-empty array');
  }

  if (!Array.isArray(config.exclude)) {
    throw new Error('Exclude patterns must be an array');
  }
}