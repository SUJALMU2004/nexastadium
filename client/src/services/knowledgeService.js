import { searchKnowledge } from "./api.js";

/**
 * Search local FIFA World Cup 2026 knowledge entries.
 *
 * @param {Record<string, string|number>} searchParams - Knowledge search filters.
 * @returns {Promise<unknown>} Knowledge search response.
 */
export function searchLocalKnowledge(searchParams) {
  return searchKnowledge(searchParams);
}
