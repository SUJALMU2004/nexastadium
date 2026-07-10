import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { useStreamingAI } from "../../hooks/useStreamingAI.js";
import { AI_ENDPOINTS } from "../../services/aiService.js";
import { FAN_ASSISTANT_SUGGESTED_QUESTIONS } from "../../utils/constants.js";

/**
 * Render the streaming fan assistant workflow for stadium operations guidance.
 *
 * @returns {JSX.Element} Stadium AI assistant page.
 */
export default function AIAssistant() {
  const { t } = useTranslation();
  const { activeStadium, activeStadiumId, activeStadiumName, selectedLanguage } = useContext(StadiumContext);
  const { streamingText, isStreaming, error, startStream } = useStreamingAI();
  const [draftMessage, setDraftMessage] = useState("");
  const [conversationMessages, setConversationMessages] = useState([]);
  const [formError, setFormError] = useState("");
  const previousStreamingStateRef = useRef(false);
  const finalizedStreamTextRef = useRef("");

  useEffect(() => {
    if (
      previousStreamingStateRef.current
      && !isStreaming
      && streamingText
      && !error
      && finalizedStreamTextRef.current !== streamingText
    ) {
      finalizedStreamTextRef.current = streamingText;
      setConversationMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", content: streamingText }
      ]);
    }

    previousStreamingStateRef.current = isStreaming;
  }, [error, isStreaming, streamingText]);

  /**
   * Start a deterministic streamed stadium assistant response.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves when streaming has completed or failed.
   */
  async function handleAssistantSubmit(submitEvent) {
    submitEvent.preventDefault();
    const sanitizedDraftMessage = draftMessage.trim();

    if (!sanitizedDraftMessage) {
      setFormError("Ask a stadium operations question before sending.");
      return;
    }

    if (sanitizedDraftMessage.length > 2000) {
      setFormError("Keep fan assistant questions under 2,000 characters.");
      return;
    }

    setFormError("");
    finalizedStreamTextRef.current = "";
    setConversationMessages((currentMessages) => [
      ...currentMessages,
      { role: "fan", content: sanitizedDraftMessage }
    ]);
    setDraftMessage("");

    await startStream(AI_ENDPOINTS.fanAssistant, {
      message: sanitizedDraftMessage,
      language: selectedLanguage,
      stadium_id: activeStadiumId,
      context: `Fan assistance for ${activeStadium.name}, capacity ${activeStadium.capacity}, focused on FIFA World Cup 2026 stadium operations.`
    });
  }

  /**
   * Load a suggested question into the textarea.
   *
   * @param {string} suggestedQuestion - Suggested fan assistance question.
   * @returns {void}
   */
  function handleSuggestedQuestionClick(suggestedQuestion) {
    setDraftMessage(suggestedQuestion);
    setFormError("");
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.fan")}
        title={t("aiAssistant.title")}
        description={`Ask sanctioned FIFA World Cup 2026 stadium questions for ${activeStadiumName}. Responses are streamed from the backend and shaped for calm, practical match-day guidance.`}
      >
        <StadiumSelector id="assistant-stadium-selector" label="Assistant venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Suggested Questions" description="Use a match-day prompt or write your own stadium operations question.">
          <div className="grid gap-2">
            {FAN_ASSISTANT_SUGGESTED_QUESTIONS.map((suggestedQuestion) => (
              <button
                key={suggestedQuestion}
                type="button"
                aria-label={`Use suggested question: ${suggestedQuestion}`}
                className="rounded-md border border-stadium-primary/10 px-3 py-2 text-left text-sm font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
                onClick={() => handleSuggestedQuestionClick(suggestedQuestion)}
              >
                {suggestedQuestion}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Assistant Conversation" description="Responses appear in real time and are announced to assistive technology.">
          <form className="space-y-4" onSubmit={handleAssistantSubmit}>
            <FormField
              label="Fan question"
              htmlFor="fan-assistant-message"
              helpText="Ask about gates, seats, food, accessibility services, transport, or safety inside the selected stadium."
              error={formError}
            >
              <textarea
                id="fan-assistant-message"
                aria-label="Fan assistant question"
                className="min-h-32 w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary shadow-sm"
                maxLength={2000}
                value={draftMessage}
                onChange={(changeEvent) => setDraftMessage(changeEvent.target.value)}
              />
            </FormField>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                aria-label="Send question to Stadium AI Assistant"
                className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isStreaming}
              >
                {isStreaming ? "Streaming..." : "Send question"}
              </button>
              <button
                type="button"
                aria-label="Clear assistant conversation"
                className="rounded-md border border-stadium-primary/20 px-4 py-2 font-semibold text-stadium-primary"
                onClick={() => {
                  setConversationMessages([]);
                  setDraftMessage("");
                  finalizedStreamTextRef.current = "";
                }}
              >
                Clear conversation
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-4" aria-live="polite">
            <ErrorMessage message={error || ""} />
            {conversationMessages.length === 0 && !streamingText ? (
              <EmptyState
                title="No assistant messages yet"
                message={`Ask a question to see FIFA World Cup 2026 stadium guidance for ${activeStadiumName}.`}
              />
            ) : null}
            {conversationMessages.map((conversationMessage, messageIndex) => (
              <article
                key={`${conversationMessage.role}-${messageIndex}`}
                className={`rounded-lg border p-4 ${
                  conversationMessage.role === "fan"
                    ? "border-stadium-primary/10 bg-stadium-surface"
                    : "border-stadium-green/20 bg-stadium-green/10"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-normal text-stadium-primary/65">
                  {conversationMessage.role === "fan" ? "Fan question" : "Stadium assistant"}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stadium-primary">{conversationMessage.content}</p>
              </article>
            ))}
            {isStreaming ? (
              <article className="rounded-lg border border-stadium-green/20 bg-stadium-green/10 p-4">
                <LoadingSpinner message="Streaming stadium assistant response" />
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stadium-primary">{streamingText}</p>
              </article>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
