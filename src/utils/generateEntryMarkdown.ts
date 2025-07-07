import path from "node:path";
import { DocumentedNode } from "../types";

/**
 * Generate Markdown for a single documentation entry
 */
export function generateEntryMarkdown(entry: DocumentedNode): string {
  const { node, name, file, jsdoc } = entry;
  let markdown = `### ${node.type} - ${name || 'Unnamed'}\n\n`;
  
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