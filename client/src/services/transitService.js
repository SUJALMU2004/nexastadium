import {
  generateEgressPlan,
  generateRouteRecommendation,
  generateFlowControlPlan,
  getTransitOptions,
  getTransportAlerts
} from "./api.js";

/**
 * Fetch static transit options for a FIFA World Cup 2026 host stadium.
 *
 * @param {string} stadiumId - Stadium slug from the backend dataset.
 * @returns {Promise<unknown>} Transit options response.
 */
export function fetchTransitOptions(stadiumId) {
  return getTransitOptions(stadiumId);
}

/**
 * Request a deterministic post-match egress plan.
 *
 * @param {Record<string, unknown>} egressPlanPayload - Egress planning request payload.
 * @returns {Promise<unknown>} Egress plan response.
 */
export function requestEgressPlan(egressPlanPayload) {
  return generateEgressPlan(egressPlanPayload);
}

/**
 * Request a deterministic route recommendation.
 *
 * @param {Record<string, unknown>} routeRecommendationPayload - Route recommendation request payload.
 * @returns {Promise<unknown>} Route recommendation response.
 */
export function requestRouteRecommendation(routeRecommendationPayload) {
  return generateRouteRecommendation(routeRecommendationPayload);
}

/**
 * Fetch stadium-specific transport alerts.
 *
 * @param {string} stadiumId - Stadium slug from the backend dataset.
 * @returns {Promise<unknown>} Transport alerts response.
 */
export function fetchTransportAlerts(stadiumId) {
  return getTransportAlerts(stadiumId);
}

/**
 * Request deterministic transit and gate flow-control guidance.
 *
 * @param {Record<string, unknown>} flowControlPayload - Flow-control request payload.
 * @returns {Promise<unknown>} Flow-control response.
 */
export function requestTransitFlowControl(flowControlPayload) {
  return generateFlowControlPlan(flowControlPayload);
}
