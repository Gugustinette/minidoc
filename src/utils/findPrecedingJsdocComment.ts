import type { Comment, Node } from "oxc-parser";

/**
 * Find JSDoc comment associated to a given AST node.
 */
export function findPrecedingJsdocComment(
	node: Node,
	comments: Comment[],
): Comment | null {
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
