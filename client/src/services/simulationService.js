import { calculateCrowdRisk, compareOperationalScenarios, generateFlowControlPlan } from "./api.js";

/**
 * Request deterministic crowd risk for an operations scenario.
 *
 * @param {Record<string, unknown>} crowdRiskPayload - Crowd risk request payload.
 * @returns {Promise<unknown>} Crowd risk response.
 */
export function requestCrowdRisk(crowdRiskPayload) {
  return calculateCrowdRisk(crowdRiskPayload);
}

/**
 * Request a comparison between two operational scenarios.
 *
 * @param {Record<string, unknown>} comparisonPayload - Scenario comparison payload.
 * @returns {Promise<unknown>} Scenario comparison response.
 */
export function requestScenarioComparison(comparisonPayload) {
  return compareOperationalScenarios(comparisonPayload);
}

/**
 * Request gate and transit flow-control recommendations.
 *
 * @param {Record<string, unknown>} flowControlPayload - Flow-control request payload.
 * @returns {Promise<unknown>} Flow-control response.
 */
export function requestFlowControlPlan(flowControlPayload) {
  return generateFlowControlPlan(flowControlPayload);
}
