import axios from "axios";

export const DEFAULT_API_BASE_URL = "http://localhost:8000";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const PA_ANNOUNCEMENT_TIMEOUT_MS = 60000;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((requestConfig) => {
  const requestStartedAt = Date.now();
  return {
    ...requestConfig,
    metadata: {
      requestStartedAt
    },
    headers: {
      ...requestConfig.headers,
      "Content-Type": "application/json"
    }
  };
});

apiClient.interceptors.response.use(
  (apiResponse) => apiResponse,
  (apiError) => {
    if (apiError.response?.status === 429) {
      throw new Error("Too many requests. Please wait a moment before trying again.");
    }

    const serverDetailMessage = apiError.response?.data?.detail;
    if (serverDetailMessage) {
      throw new Error(serverDetailMessage);
    }

    throw new Error("Something went wrong. Please try again.");
  }
);

/**
 * Post a JSON payload to an AI endpoint.
 *
 * @param {string} endpoint - AI endpoint path such as /api/ai/ops-recommendation.
 * @param {Record<string, unknown>} payload - Request body sent to the backend.
 * @returns {Promise<unknown>} Parsed response payload.
 */
export async function postToAI(endpoint, payload) {
  const aiResponse = await apiClient.post(endpoint, payload, {
    timeout: endpoint === "/api/ai/pa-announcement" ? PA_ANNOUNCEMENT_TIMEOUT_MS : DEFAULT_REQUEST_TIMEOUT_MS
  });
  return aiResponse.data;
}

/**
 * Fetch the full FIFA World Cup 2026 stadium list.
 *
 * @returns {Promise<unknown>} Stadium list response from the backend.
 */
export async function getStadiumList() {
  const stadiumResponse = await apiClient.get("/api/stadium/list");
  return stadiumResponse.data;
}

/**
 * Fetch either the full stadium list or one stadium by ID.
 *
 * @param {string} [stadiumId] - Optional stadium slug.
 * @returns {Promise<unknown>} Stadium response from the backend.
 */
export async function getStadiumData(stadiumId = "") {
  const stadiumEndpoint = stadiumId ? `/api/stadium/${stadiumId}` : "/api/stadium/list";
  const stadiumResponse = await apiClient.get(stadiumEndpoint);
  return stadiumResponse.data;
}

/**
 * Fetch predefined stadium operations scenarios.
 *
 * @returns {Promise<unknown>} Scenario list response.
 */
export async function getScenarios() {
  const scenarioResponse = await apiClient.get("/api/stadium/scenarios/list");
  return scenarioResponse.data;
}

/**
 * Fetch static transit options for a stadium.
 *
 * @param {string} stadiumId - Stadium slug.
 * @returns {Promise<unknown>} Transit options response.
 */
export async function getTransitOptions(stadiumId) {
  const transitResponse = await apiClient.get(`/api/transit/options/${stadiumId}`);
  return transitResponse.data;
}

/**
 * Generate a deterministic post-match egress plan.
 *
 * @param {Record<string, unknown>} payload - Egress plan request payload.
 * @returns {Promise<unknown>} Egress plan response.
 */
export async function generateEgressPlan(payload) {
  const egressPlanResponse = await apiClient.post("/api/transit/egress-plan", payload);
  return egressPlanResponse.data;
}

/**
 * Generate a deterministic stadium route recommendation.
 *
 * @param {Record<string, unknown>} payload - Route recommendation request payload.
 * @returns {Promise<unknown>} Route recommendation response.
 */
export async function generateRouteRecommendation(payload) {
  const routeRecommendationResponse = await apiClient.post("/api/transit/route-recommendation", payload);
  return routeRecommendationResponse.data;
}

/**
 * Fetch deterministic transport alerts for a stadium.
 *
 * @param {string} stadiumId - Stadium slug.
 * @returns {Promise<unknown>} Transport alerts response.
 */
export async function getTransportAlerts(stadiumId) {
  const transportAlertsResponse = await apiClient.get(`/api/transit/alerts/${stadiumId}`);
  return transportAlertsResponse.data;
}

/**
 * Search local FIFA World Cup 2026 knowledge entries through the backend.
 *
 * @param {Record<string, string|number>} searchParams - Query, stadium, category, tags, and limit filters.
 * @returns {Promise<unknown>} Knowledge search response.
 */
export async function searchKnowledge(searchParams) {
  const knowledgeSearchResponse = await apiClient.get("/api/knowledge/search", {
    params: searchParams
  });
  return knowledgeSearchResponse.data;
}

/**
 * Calculate deterministic crowd risk for an operations scenario.
 *
 * @param {Record<string, unknown>} payload - Crowd risk request payload.
 * @returns {Promise<unknown>} Crowd risk response.
 */
export async function calculateCrowdRisk(payload) {
  const crowdRiskResponse = await apiClient.post("/api/simulation/crowd-risk", payload);
  return crowdRiskResponse.data;
}

/**
 * Compare two predefined operational scenarios.
 *
 * @param {Record<string, unknown>} payload - Scenario comparison request payload.
 * @returns {Promise<unknown>} Scenario comparison response.
 */
export async function compareOperationalScenarios(payload) {
  const scenarioComparisonResponse = await apiClient.post("/api/simulation/scenario-compare", payload);
  return scenarioComparisonResponse.data;
}

/**
 * Generate deterministic gate and transit flow-control guidance.
 *
 * @param {Record<string, unknown>} payload - Flow-control request payload.
 * @returns {Promise<unknown>} Flow-control response.
 */
export async function generateFlowControlPlan(payload) {
  const flowControlResponse = await apiClient.post("/api/simulation/flow-control", payload);
  return flowControlResponse.data;
}

/**
 * Generate a structured operations summary and Markdown report.
 *
 * @param {Record<string, unknown>} payload - Operations summary request payload.
 * @returns {Promise<unknown>} Operations summary response.
 */
export async function generateOperationsSummary(payload) {
  const operationsSummaryResponse = await apiClient.post("/api/reports/operations-summary", payload);
  return operationsSummaryResponse.data;
}
