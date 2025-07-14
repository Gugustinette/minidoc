import { IdentifierName, MethodDefinition, parseSync, PropertyDefinition } from 'oxc-parser';
import { walk } from 'oxc-walker';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { RolldownPlugin, TransformResult } from 'rolldown';
import { DocumentedNode, Options } from './types';
import { findPrecedingJsdocComment } from './utils/findPrecedingJsdocComment';
import { parseJsdocComment } from './utils/parseJsdocComment';
import { generateMarkdown } from './utils/generateMarkdown';

const documentedNodes: DocumentedNode[] = [];

/**
 * Main Rolldown plugin function
 */
export default function minidoc(options = {}): RolldownPlugin {
  const {}: Options = options;

  return {
    name: 'minidoc',

    buildStart() {
      console.log('minidoc: Starting documentation collection...');
    },
    
    transform: {
      handler (this, code: string, id: string): TransformResult {
        try {
          // Parse the source code
          const parseResult = parseSync(id, code, {
            sourceType: 'module',
            range: true
          });

          // Filter JSDoc comments
          const jsdocComments = parseResult.comments
            .filter(comment => 
              comment.type === 'Block'
            );

          if (jsdocComments.length === 0) {
            return null;
          }

          walk(parseResult.program, {
            enter: (untypedNode) => {
              // Check if the node is a function, class, or variable declaration
              if (!['MethodDefinition', 'PropertyDefinition'].includes(untypedNode.type)) {
                return null;
              }

              // Re-cast to filtered types
              const node: MethodDefinition | PropertyDefinition = untypedNode as MethodDefinition | PropertyDefinition;
              const nodeKey: IdentifierName = node.key as IdentifierName;

              // Find corresponding JSDoc comment
              const precedingJsdocComment = findPrecedingJsdocComment(node, jsdocComments);

              if (precedingJsdocComment) {
                const jsdoc = parseJsdocComment(precedingJsdocComment.value);
                documentedNodes.push({
                  id: `${id}:${nodeKey.name}:${node.start}:${node.end}`,
                  name: nodeKey.name,
                  file: id,
                  node,
                  jsdoc,
                });

                // Remove the comment from the list to avoid duplicates
                const index = jsdocComments.indexOf(precedingJsdocComment);
                if (index !== -1) {
                  jsdocComments.splice(index, 1);
                }
              }
            }
          });

          // Debug
          /*
          if (documentedNodes.length > 0) {
            console.log(`minidoc: Found ${documentedNodes.length} documented nodes in ${id}`);
          }
          */
        } catch (error) {
          console.warn(`minidoc: Failed to parse ${id}:`, error.message);
        }
        return null;
      },
    },

    generateBundle() {
      console.log(`minidoc: Generating documentation with ${documentedNodes.length} entries...`);

      // Generate markdown
      const markdown = generateMarkdown(documentedNodes, options);
      
      // Ensure output directory exists
      const outputPath = path.resolve("docs", "index.md");
      const outputDir = path.dirname(outputPath);
      
      try {
        mkdirSync(outputDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }
      
      // Write documentation file
      writeFileSync(outputPath, markdown, 'utf8');
      console.log(`minidoc: Documentation generated at ${outputPath}`);
    }
  };
}
