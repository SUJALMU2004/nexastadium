import { useCallback, useEffect, useRef, useState } from "react";
import { openAIStreamingResponse } from "../services/aiService.js";

/**
 * Stream POST-compatible AI responses using fetch and ReadableStream.
 *
 * @returns {{streamingText: string, isStreaming: boolean, error: string|null, startStream: Function}} Streaming state and starter.
 */
export function useStreamingAI() {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startStream = useCallback(async (endpoint, payload) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const streamAbortController = new AbortController();
    abortControllerRef.current = streamAbortController;

    setStreamingText("");
    setError(null);
    setIsStreaming(true);

    try {
      const streamResponse = await openAIStreamingResponse(endpoint, payload, streamAbortController.signal);
      const responseReader = streamResponse.body.getReader();
      const responseDecoder = new TextDecoder();
      let streamIsComplete = false;
      let pendingSseText = "";

      while (!streamIsComplete) {
        const streamReadResult = await responseReader.read();

        if (streamReadResult.done) {
          streamIsComplete = true;
          pendingSseText += responseDecoder.decode();
        } else if (streamReadResult.value) {
          pendingSseText += responseDecoder.decode(streamReadResult.value, { stream: true });
        }

        const completeSseEvents = pendingSseText.split("\n\n");
        pendingSseText = completeSseEvents.pop() || "";

        completeSseEvents.forEach((sseEventText) => {
          const readableChunk = sseEventText
            .split("\n")
            .filter((chunkLine) => chunkLine.startsWith("data: "))
            .map((chunkLine) => chunkLine.replace("data: ", ""))
            .join("");

          if (readableChunk === "[DONE]") {
            streamIsComplete = true;
            return;
          }

          if (readableChunk && isMountedRef.current) {
            setStreamingText((currentStreamingText) => `${currentStreamingText}${readableChunk}`);
          }
        });
      }
    } catch (caughtError) {
      if (caughtError.name !== "AbortError" && isMountedRef.current) {
        setError(caughtError.message || "The stadium assistant stream ended unexpectedly.");
      }
    } finally {
      abortControllerRef.current = null;
      if (isMountedRef.current) {
        setIsStreaming(false);
      }
    }
  }, []);

  return { streamingText, isStreaming, error, startStream };
}
