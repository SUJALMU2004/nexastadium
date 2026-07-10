import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ScenarioSelector from "../../components/common/ScenarioSelector.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import Timeline from "../../components/common/Timeline.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { generateMatchDayBriefing } from "../../services/aiService.js";
import { BRIEFING_FOCUS_OPTIONS, WEATHER_CONDITION_OPTIONS } from "../../utils/constants.js";

/**
 * Render the AI-assisted match-day briefing workflow for venue command.
 *
 * @returns {JSX.Element} Match-day briefing page.
 */
export default function MatchDayBriefing() {
  const { t } = useTranslation();
  const { activeScenario, activeStadium, activeStadiumId, activeStadiumName, selectedLanguage } = useContext(StadiumContext);
  const [briefingFocus, setBriefingFocus] = useState(BRIEFING_FOCUS_OPTIONS[0]);
  const [expectedAttendance, setExpectedAttendance] = useState(activeStadium.capacity || 80000);
  const [weatherCondition, setWeatherCondition] = useState("Clear");
  const [briefingNotes, setBriefingNotes] = useState("");
  const [briefingResponse, setBriefingResponse] = useState(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState("");

  /**
   * Submit briefing context to the backend AI route.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after briefing response updates.
   */
  async function handleBriefingSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (briefingNotes.length > 1000) {
      setBriefingError("Briefing notes must stay under 1,000 characters.");
      return;
    }

    setIsLoadingBriefing(true);
    setBriefingError("");

    try {
      const generatedBriefing = await generateMatchDayBriefing({
        stadium_id: activeStadiumId,
        scenario_id: activeScenario,
        language: selectedLanguage,
        briefing_focus: briefingFocus,
        expected_attendance: Number(expectedAttendance),
        weather_condition: weatherCondition,
        notes: briefingNotes
      });
      setBriefingResponse(generatedBriefing);
    } catch (caughtError) {
      setBriefingError(caughtError.message || "The match-day briefing could not be generated.");
    } finally {
      setIsLoadingBriefing(false);
    }
  }

  const timelineItems = briefingResponse
    ? [
        { title: "Before gates", description: briefingResponse.volunteer_coordination },
        { title: "Peak arrival", description: briefingResponse.accessibility_focus },
        { title: "Post-match", description: briefingResponse.transit_focus }
      ]
    : [];

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("matchDayBriefing.title")}
        description={`Generate a FIFA World Cup 2026 command briefing for ${activeStadiumName} using local venue, scenario, and knowledge context.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="briefing-stadium-selector" label="Briefing venue" />
          <ScenarioSelector id="briefing-scenario-selector" label="Scenario context" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Briefing Inputs" description="Inputs are sanitized before reaching the backend AI service.">
          <form className="space-y-4" onSubmit={handleBriefingSubmit}>
            <FormField label="Briefing focus" htmlFor="briefing-focus">
              <select
                id="briefing-focus"
                aria-label="Briefing focus"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={briefingFocus}
                onChange={(changeEvent) => setBriefingFocus(changeEvent.target.value)}
              >
                {BRIEFING_FOCUS_OPTIONS.map((focusOption) => (
                  <option key={focusOption} value={focusOption}>{focusOption}</option>
                ))}
              </select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Expected attendance" htmlFor="briefing-attendance">
                <input
                  id="briefing-attendance"
                  aria-label="Expected attendance"
                  className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                  min="0"
                  type="number"
                  value={expectedAttendance}
                  onChange={(changeEvent) => setExpectedAttendance(changeEvent.target.value)}
                />
              </FormField>
              <FormField label="Weather condition" htmlFor="briefing-weather">
                <select
                  id="briefing-weather"
                  aria-label="Weather condition"
                  className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                  value={weatherCondition}
                  onChange={(changeEvent) => setWeatherCondition(changeEvent.target.value)}
                >
                  {WEATHER_CONDITION_OPTIONS.map((weatherOption) => (
                    <option key={weatherOption} value={weatherOption}>{weatherOption}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Staff notes" htmlFor="briefing-notes" helpText={`${briefingNotes.length}/1000 characters. Do not enter personal data.`}>
              <textarea
                id="briefing-notes"
                aria-label="Staff notes"
                className="min-h-28 w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                maxLength={1000}
                value={briefingNotes}
                onChange={(changeEvent) => setBriefingNotes(changeEvent.target.value)}
              />
            </FormField>
            <button
              type="submit"
              aria-label="Generate match-day briefing"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingBriefing}
            >
              Generate briefing
            </button>
          </form>
        </Card>

        <Card title="Command Briefing" description="Structured briefing output for the stadium operations room.">
          <div aria-live="polite" className="space-y-5">
            <ErrorMessage message={briefingError} />
            {isLoadingBriefing ? <LoadingSpinner message="Generating match-day briefing" /> : null}
            {!isLoadingBriefing && !briefingResponse ? (
              <EmptyState title="No briefing generated yet" message="Submit command context to generate the match-day briefing." />
            ) : null}
            {briefingResponse ? (
              <>
                <article className="rounded-lg bg-stadium-surface p-4">
                  <h2 className="text-lg font-bold text-stadium-primary">{briefingResponse.briefing_title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stadium-primary/75">{briefingResponse.executive_summary}</p>
                </article>
                <ActionList title="Key risks" items={briefingResponse.key_risks} />
                <ActionList title="Recommended actions" items={briefingResponse.recommended_actions} />
                <Timeline items={timelineItems} />
                <p className="rounded-lg bg-stadium-green/10 p-4 text-sm leading-6 text-stadium-primary">
                  <span className="font-semibold">Sustainability:</span> {briefingResponse.sustainability_focus}
                </p>
              </>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
