import { Node } from "oxc-parser";

export interface MinidocConfig {
  /** Input files or directories to process */
  input: string | string[];
  /** Output directory for generated docs */
  outputDir: string;
  /** File patterns to include */
  include: string[];
  /** File patterns to exclude */
  exclude: string[];
  /** Custom title for the documentation */
  title?: string;
  /** Template directory for custom templates */
  templateDir?: string;
  /** Whether to watch for file changes */
  watch?: boolean;
  /** Rollup output format */
  format?: 'es' | 'cjs' | 'umd' | 'iife';
  /** Custom parser options */
  parserOptions?: Record<string, any>;
}

export interface DocumentedItem {
  name: string;
  type: 'function' | 'class' | 'variable' | 'method' | 'constructor';
  description: string;
  tags: any[];
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