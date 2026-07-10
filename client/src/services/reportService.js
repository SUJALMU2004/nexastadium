import { generateOperationsSummary } from "./api.js";

/**
 * Request a structured operations summary and Markdown report.
 *
 * @param {Record<string, unknown>} reportPayload - Operations report request payload.
 * @returns {Promise<unknown>} Operations report response.
 */
export function requestOperationsSummary(reportPayload) {
  return generateOperationsSummary(reportPayload);
}
