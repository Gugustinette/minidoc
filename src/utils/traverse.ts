import type { ParseResult } from "oxc-parser"

/**
 * Traverses an Abstract Syntax Tree (AST) and applies a visitor pattern.
 * @param ast The AST to traverse
 * @param visitor An object with `enter` and `exit` methods to call on each node
 * @example
 * ```ts
 *  traverse(ast, {
       enter(path) {
         const { node } = path;
         let docItem: DocumentedItem | null = null;
 
         if (node.leadingComments) {
           const jsdocComment = node.leadingComments.find((comment) =>
             comment.value.trim().startsWith('*')
           );
 
           if (jsdocComment) {
             const parsedJSDoc = parseJSDocComment(jsdocComment.value);
 
             if (parsedJSDoc) {
               docItem = createDocumentationItem(
                 node,
                 parsedJSDoc,
                 filePath,
                 path
               );
             }
           }
         }
 
         if (docItem) {
           const key = generateUniqueKey(docItem, filePath);
           documentedItems.set(key, docItem);
         }
       },
     });
  * ```
 */
export function traverse(
  ast: ParseResult,
  visitor: {
    enter?: (path: { node: any; parent: any }) => void;
    exit?: (path: { node: any; parent: any }) => void;
  }
): void {
  if (!ast || !ast.program || !visitor) return;

  const traverseNode = (node: any, parent: any) => {
    const path = { node, parent };

    if (visitor.enter) {
      visitor.enter(path);
    }

    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        traverseNode(node[key], node);
      }
    }

    if (visitor.exit) {
      visitor.exit(path);
    }
  };

  traverseNode(ast.program, null);
}
