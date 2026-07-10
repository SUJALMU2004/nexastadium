import { getScenarios, getStadiumData, getStadiumList } from "./api.js";

/**
 * Fetch all FIFA World Cup 2026 host stadium records.
 *
 * @returns {Promise<unknown>} Stadium list response.
 */
export function fetchStadiumList() {
  return getStadiumList();
}

/**
 * Fetch one FIFA World Cup 2026 host stadium by ID.
 *
 * @param {string} stadiumId - Stadium slug from the backend dataset.
 * @returns {Promise<unknown>} Stadium response.
 */
export function fetchStadiumById(stadiumId) {
  return getStadiumData(stadiumId);
}

/**
 * Fetch predefined match-day operations scenarios.
 *
 * @returns {Promise<unknown>} Scenario list response.
 */
export function fetchOperationalScenarios() {
  return getScenarios();
}

/**
 * Fetch predefined match-day operations scenarios for shared selectors.
 *
 * @returns {Promise<unknown>} Scenario list response.
 */
export function fetchScenarioList() {
  return getScenarios();
}
