// rolldown-jsdoc-plugin.js
import { Comment, Node, parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { RolldownPlugin } from 'rolldown';

/**
 * Find JSDoc comment that precedes a given AST node
 */
function findPrecedingJSDocComment(node: Node, comments: Comment[]): Comment | null {  
  // Find the last JSDoc comment before this node
  let bestComment: Comment | null = null;
  let bestDistance = Infinity;
  
  for (const comment of comments) {
    if (comment.end < node.start) {
      const distance = node.start - comment.end;
      // Only consider comments within reasonable distance (300 chars)
      // and closer than any previous match
      if (distance < 300 && distance < bestDistance) {
        bestComment = comment;
        bestDistance = distance;
      }
    }
  }
  
  return bestComment;
}

interface JSDocSection {
  description: string;
  tags: Record<string, string[]>;
}

/**
 * Utility to parse JSDoc comments into structured data
 */
function parseJSDocComment(commentText) {
  // Remove every ' * ' from the start of each line
  const cleanedText = commentText
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))
    .join('\n');
  
  // Description is everything before the first tag
  const descriptionMatch = cleanedText.match(/^(.*?)(\n\s*@|$)/s);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';

  // Extract tags and parameters
  const tags: Record<string, string[]> = {};
  const tagRegex = /@(\w+)(?:\s+([^\n]+))?/g;
  let match;
  while ((match = tagRegex.exec(cleanedText)) !== null) {
    const tagName = match[1];
    const tagValue = match[2] ? match[2].trim() : '';
    
    if (!tags[tagName]) {
      tags[tagName] = [];
    }
    
    // Handle special case for @param
    if (tagName === 'param') {
      // Split by spaces, but keep type annotations
      const paramParts = tagValue.split(/\s+/);
      const paramType = paramParts.shift();
      const paramName = paramParts.shift();
      const paramDescription = paramParts.join(' ');
      tags[tagName].push(`${paramType} ${paramName} - ${paramDescription}`);
    } else {
      tags[tagName].push(tagValue);
    }
  }
  // Handle returns tag
  if (tags['returns'] || tags['return']) {
    const returns = tags['returns'] || tags['return'];
    if (returns.length > 0) {
      tags['returns'] = returns.map(ret => {
        // Split by spaces, but keep type annotations
        const parts = ret.split(/\s+/);
        const type = parts.shift();
        const description = parts.join(' ');
        return `${type} - ${description}`;
      });
    }
  }
  // Handle example tag
  if (tags['example']) {
    tags['example'] = tags['example'].map(example => {
      // Remove leading/trailing whitespace and backticks
      return example.trim().replace(/^`+|`+$/g, '');
    });
  }
  // Handle other tags
  const otherTags = ['throws', 'see', 'since', 'deprecated', 'author'];
  for (const tag of otherTags) {
    if (tags[tag]) {
      tags[tag] = tags[tag].map(value => value.trim());
    }
  }
  return {
    description,
    tags: tags
  };
}

/**
 * Generate Markdown documentation from collected JSDoc entries
 */
function generateMarkdown(documentedNodes: DocumentedNode[], options = {}): string {
  const { title = 'API Documentation', groupByType = true }: any = options;
  
  let markdown = `# ${title}\n\n`;
  
  if (documentedNodes.length === 0) {
    markdown += '_No documented functions or classes found._\n';
    return markdown;
  }
  
  // Group by type if requested
  if (groupByType) {
    const grouped = documentedNodes.reduce((acc, entry) => {
      const type = entry.node.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(entry);
      return acc;
    }, {});
    
    const typeHeaders = {
      'ClassDeclaration': '## Classes',
      'FunctionDeclaration': '## Functions', 
      'FunctionExpression': '## Functions',
    };
    
    for (const type of Object.keys(grouped)) {
      if (grouped[type]) {
        markdown += `${typeHeaders[type] || `## ${type}s`}\n\n`;
        for (const entry of grouped[type]) {
          markdown += generateEntryMarkdown(entry);
        }
      }
    }
  } else {
    // Generate entries in order
    for (const entry of documentedNodes) {
      markdown += generateEntryMarkdown(entry);
    }
  }
  
  return markdown;
}

/**
 * Generate Markdown for a single documentation entry
 */
function generateEntryMarkdown(entry: DocumentedNode): string {
  const { node, jsdoc, file } = entry;
  const nodeId = `${node.type}-${node.start}-${node.end}`;
  let markdown = `### ${node.type} - ${nodeId || 'Unnamed'}\n\n`;
  
  // Add file reference
  markdown += `*File: [${path.basename(file)}](${file})*\n\n`;
  
  // Add JSDoc description
  if (jsdoc.description) {
    markdown += `${jsdoc.description}\n\n`;
  }
  
  // Add tags
  if (Object.keys(jsdoc.tags).length > 0) {
    markdown += '#### Tags:\n';
    for (const [tag, values] of Object.entries(jsdoc.tags)) {
      const valueArray = Array.isArray(values) ? values : [values];
      markdown += `- **@${tag}**: ${valueArray.join(', ')}\n`;
    }
    markdown += '\n';
  }
  
  // Add parameters if available
  if (jsdoc.tags['param']) {
    markdown += '#### Parameters:\n';
    jsdoc.tags['param'].forEach(param => {
      markdown += `- ${param}\n`;
    });
    markdown += '\n';
  }
  
  // Add return type if available
  if (jsdoc.tags['returns']) {
    markdown += '#### Returns:\n';
    jsdoc.tags['returns'].forEach(ret => {
      markdown += `- ${ret}\n`;
    });
    markdown += '\n';
  }
  
  // Add examples if available
  if (jsdoc.tags['example']) {
    markdown += '#### Examples:\n';
    jsdoc.tags['example'].forEach(example => {
      markdown += `\`\`\`js\n${example}\n\`\`\`\n`;
    });
    markdown += '\n';
  }
  
  return markdown;
}

interface DocumentedNode {
  node: Node;
  jsdoc: any;
  file: string;
}

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
            const jsdocComment = findPrecedingJSDocComment(node, jsdocComments);

            if (jsdocComment) {
              const jsdoc = parseJSDocComment(jsdocComment.value);
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
