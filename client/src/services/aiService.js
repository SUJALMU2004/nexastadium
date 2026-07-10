import { DEFAULT_API_BASE_URL, postToAI } from "./api.js";

export const AI_ENDPOINTS = {
  fanAssistant: "/api/ai/fan-assistant",
  navigationGuidance: "/api/ai/navigation-guidance",
  opsRecommendation: "/api/ai/ops-recommendation",
  paAnnouncement: "/api/ai/pa-announcement",
  matchDayBriefing: "/api/ai/match-day-briefing",
  safetySupportPack: "/api/ai/safety-support-pack"
};

/**
 * Build a full backend URL for a POST-compatible AI stream endpoint.
 *
 * @param {string} endpoint - Backend AI endpoint path.
 * @returns {string} Full URL for fetch-based streaming.
 */
export function buildAIStreamingUrl(endpoint) {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return `${configuredApiBaseUrl}${endpoint}`;
}

/**
 * Open a fetch response for an AI streaming request.
 *
 * @param {string} endpoint - Backend AI streaming endpoint path.
 * @param {Record<string, unknown>} payload - Request body for the AI route.
 * @param {AbortSignal} abortSignal - Signal used to cancel the request on unmount.
 * @returns {Promise<Response>} Fetch response with a readable stream body.
 */
export async function openAIStreamingResponse(endpoint, payload, abortSignal) {
  const streamResponse = await fetch(buildAIStreamingUrl(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: abortSignal
  });

  if (!streamResponse.ok || !streamResponse.body) {
    throw new Error("The stadium assistant stream could not be started.");
  }

  return streamResponse;
}

/**
 * Stream fan assistant response chunks through callbacks.
 *
 * @param {Record<string, unknown>} payload - Fan assistant request payload.
 * @param {(chunk: string) => void} onChunk - Callback for each readable chunk.
 * @param {(error: Error) => void} onError - Callback for stream errors.
 * @param {() => void} onComplete - Callback when streaming completes.
 * @param {AbortSignal} abortSignal - Signal used to cancel the request.
 * @returns {Promise<void>} Resolves when streaming completes.
 */
export async function streamFanAssistantResponse(payload, onChunk, onError, onComplete, abortSignal) {
  try {
    const streamResponse = await openAIStreamingResponse(AI_ENDPOINTS.fanAssistant, payload, abortSignal);
    const responseReader = streamResponse.body.getReader();
    const responseDecoder = new TextDecoder();
    let streamIsComplete = false;

    while (!streamIsComplete) {
      const streamReadResult = await responseReader.read();
      streamIsComplete = streamReadResult.done;

      if (streamReadResult.value) {
        const decodedChunk = responseDecoder.decode(streamReadResult.value, { stream: true });
        decodedChunk
          .split("\n")
          .filter((chunkLine) => chunkLine.startsWith("data: "))
          .map((chunkLine) => chunkLine.replace("data: ", ""))
          .filter((chunkLine) => chunkLine !== "[DONE]")
          .forEach((readableChunk) => {
            if (readableChunk) {
              onChunk(readableChunk);
            }
          });
      }
    }

    onComplete();
  } catch (caughtError) {
    if (caughtError.name !== "AbortError") {
      onError(caughtError);
    }
  }
}

/**
 * Request step-by-step stadium navigation guidance.
 *
 * @param {Record<string, unknown>} navigationPayload - Navigation request payload.
 * @returns {Promise<unknown>} Navigation guidance response.
 */
export function getNavigationGuidance(navigationPayload) {
  return postToAI(AI_ENDPOINTS.navigationGuidance, navigationPayload);
}

/**
 * Request a structured operations recommendation from the AI service.
 *
 * @param {Record<string, unknown>} recommendationPayload - Scenario and incident payload.
 * @returns {Promise<unknown>} Structured operations recommendation response.
 */
export function requestOpsRecommendation(recommendationPayload) {
  return postToAI(AI_ENDPOINTS.opsRecommendation, recommendationPayload);
}

/**
 * Request a structured operations recommendation through the compatibility alias.
 *
 * @param {Record<string, unknown>} recommendationPayload - Scenario and incident payload.
 * @returns {Promise<unknown>} Structured operations recommendation response.
 */
export function getOpsRecommendation(recommendationPayload) {
  return requestOpsRecommendation(recommendationPayload);
}

/**
 * Request PA announcements for an active stadium scenario.
 *
 * @param {Record<string, unknown>} announcementPayload - Scenario and language payload.
 * @returns {Promise<unknown>} Announcement response keyed by language code.
 */
export function requestPaAnnouncement(announcementPayload) {
  return postToAI(AI_ENDPOINTS.paAnnouncement, announcementPayload);
}

/**
 * Request PA announcements through the compatibility alias.
 *
 * @param {Record<string, unknown>} announcementPayload - Scenario and language payload.
 * @returns {Promise<unknown>} Announcement response keyed by language code.
 */
export function getPAAnnouncement(announcementPayload) {
  return requestPaAnnouncement(announcementPayload);
}

/**
 * Request an AI-assisted match-day operations briefing.
 *
 * @param {Record<string, unknown>} briefingPayload - Briefing request payload.
 * @returns {Promise<unknown>} Match-day briefing response.
 */
export function generateMatchDayBriefing(briefingPayload) {
  return postToAI(AI_ENDPOINTS.matchDayBriefing, briefingPayload);
}

/**
 * Request a multilingual fan safety support pack.
 *
 * @param {Record<string, unknown>} safetySupportPayload - Safety support request payload.
 * @returns {Promise<unknown>} Safety support pack response.
 */
export function generateSafetySupportPack(safetySupportPayload) {
  return postToAI(AI_ENDPOINTS.safetySupportPack, safetySupportPayload);
}
