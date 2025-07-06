import { parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { RolldownPlugin } from 'rolldown';
import { DocumentedNode } from './types';
import { findPrecedingJsdocComment } from './utils/findPrecedingJsdocComment';
import { parseJsdocComment } from './utils/parseJsdocComment';
import { generateMarkdown } from './utils/generateMarkdown';

const documentedNodes: DocumentedNode[] = [];

/**
 * Main Rolldown plugin function
 */
export default function jsdocPlugin(options = {}): RolldownPlugin {
  const {
    outputFile = 'docs/api.md',
    include = /\.(js|ts|jsx|tsx)$/,
    exclude = /node_modules/,
    title = 'API Documentation',
    groupByType = true
  }: any = options;

  return {
    name: 'jsdoc-markdown',
    
    buildStart() {
      console.log('JSDoc plugin: Starting documentation collection...');
    },
    
    transform(this, code, id) {
      // Skip if file doesn't match include/exclude patterns
      if (id.match(exclude) || !id.match(include)) {
        return null;
      }
      
      try {
        // Parse the source code
        const parseResult = parseSync(id, code, {
          sourceType: 'module',
          range: true
        });

        // Filter JSDoc comments
        const jsdocComments = parseResult.comments
          .filter(comment => 
            comment.type === 'Block' && 
            comment.value.startsWith('*')
          );

        if (jsdocComments.length === 0) {
          return null;
        }

        walk(parseResult.program, {
          enter: (node) => {
            // Check if the node is a function, class, or variable declaration
            if (!['FunctionDeclaration', 'FunctionExpression', 'ClassDeclaration', 'VariableDeclaration'].includes(node.type)) {
              return;
            }

            // Find corresponding JSDoc comment
            const jsdocComment = findPrecedingJsdocComment(node, jsdocComments);

            if (jsdocComment) {
              const jsdoc = parseJsdocComment(jsdocComment.value);
              documentedNodes.push({ 
                node, 
                jsdoc,
                file: id 
              });

              // Remove the comment from the list to avoid duplicates
              const index = jsdocComments.indexOf(jsdocComment);
              if (index !== -1) {
                jsdocComments.splice(index, 1);
              }
            }
          }
        });

        if (documentedNodes.length > 0) {
          console.log(`JSDoc plugin: Found ${documentedNodes.length} documented nodes in ${path.basename(id)}`);
        }
      } catch (error) {
        console.warn(`JSDoc plugin: Failed to parse ${id}:`, error.message);
      }
      return null;
    },
    
    generateBundle() {
      console.log(`JSDoc plugin: Generating documentation with ${documentedNodes.length} entries...`);

      // Generate markdown
      const markdown = generateMarkdown(documentedNodes, { title, groupByType });
      
      // Ensure output directory exists
      const outputPath = path.resolve(outputFile);
      const outputDir = path.dirname(outputPath);
      
      try {
        mkdirSync(outputDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }
      
      // Write documentation file
      writeFileSync(outputPath, markdown, 'utf8');
      console.log(`JSDoc plugin: Documentation generated at ${outputPath}`);
    }
  };
}
