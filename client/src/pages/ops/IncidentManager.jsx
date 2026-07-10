import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ScenarioSelector from "../../components/common/ScenarioSelector.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { getOpsRecommendation } from "../../services/aiService.js";
import { INCIDENT_TYPE_OPTIONS, SEVERITY_OPTIONS } from "../../utils/constants.js";

/**
 * Render incident intake and deterministic AI response planning for ops staff.
 *
 * @returns {JSX.Element} Incident manager page.
 */
export default function IncidentManager() {
  const { t } = useTranslation();
  const { activeScenario, activeStadium, activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPE_OPTIONS[0]);
  const [severity, setSeverity] = useState("Medium");
  const [affectedZone, setAffectedZone] = useState(activeStadium.zones?.[0]?.name || "Main concourse");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  const zoneOptions = activeStadium.zones?.length ? activeStadium.zones : [{ name: "Main concourse" }];

  useEffect(() => {
    setAffectedZone(activeStadium.zones?.[0]?.name || "Main concourse");
  }, [activeStadium.id, activeStadium.zones]);

  /**
   * Submit the incident context to the AI operations endpoint.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after recommendation state updates.
   */
  async function handleIncidentSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (incidentNotes.length > 1000) {
      setRecommendationError("Incident notes must stay under 1,000 characters.");
      return;
    }

    setIsLoadingRecommendation(true);
    setRecommendationError("");

    try {
      const recommendationResponse = await getOpsRecommendation({
        scenario_id: activeScenario,
        incident_type: incidentType,
        stadium_id: activeStadiumId,
        severity,
        affected_zone: affectedZone,
        notes: incidentNotes
      });
      setRecommendation(recommendationResponse);
    } catch (caughtError) {
      setRecommendationError(caughtError.message || "The incident action plan could not be generated.");
    } finally {
      setIsLoadingRecommendation(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("incidentManager.title")}
        description={`Turn live incident context at ${activeStadiumName} into a structured FIFA World Cup 2026 action plan without logging message content.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="incident-stadium-selector" label="Incident venue" />
          <ScenarioSelector id="incident-scenario-selector" label="Scenario context" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Incident Intake" description="Required fields keep the AI action plan precise and auditable.">
          <form className="space-y-4" onSubmit={handleIncidentSubmit}>
            <FormField label="Incident type" htmlFor="incident-type">
              <select
                id="incident-type"
                aria-label="Incident type"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={incidentType}
                onChange={(changeEvent) => setIncidentType(changeEvent.target.value)}
              >
                {INCIDENT_TYPE_OPTIONS.map((incidentOption) => (
                  <option key={incidentOption} value={incidentOption}>{incidentOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Severity" htmlFor="incident-severity">
              <select
                id="incident-severity"
                aria-label="Incident severity"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={severity}
                onChange={(changeEvent) => setSeverity(changeEvent.target.value)}
              >
                {SEVERITY_OPTIONS.map((severityOption) => (
                  <option key={severityOption} value={severityOption}>{severityOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Affected zone" htmlFor="incident-affected-zone">
              <select
                id="incident-affected-zone"
                aria-label="Affected zone"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={affectedZone}
                onChange={(changeEvent) => setAffectedZone(changeEvent.target.value)}
              >
                {zoneOptions.map((stadiumZone) => (
                  <option key={stadiumZone.name} value={stadiumZone.name}>{stadiumZone.name}</option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Operational notes"
              htmlFor="incident-notes"
              helpText={`${incidentNotes.length}/1000 characters. Do not enter personal data.`}
            >
              <textarea
                id="incident-notes"
                aria-label="Operational notes"
                className="min-h-28 w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                maxLength={1000}
                value={incidentNotes}
                onChange={(changeEvent) => setIncidentNotes(changeEvent.target.value)}
              />
            </FormField>
            <button
              type="submit"
              aria-label="Generate incident action plan"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingRecommendation}
            >
              Generate action plan
            </button>
          </form>
        </Card>

        <Card title="AI Response Plan" description="Structured stadium operations output shaped like the backend AI response contract.">
          <ErrorMessage message={recommendationError} />
          {isLoadingRecommendation ? <LoadingSpinner message="Generating incident action plan" /> : null}
          {!isLoadingRecommendation && !recommendation ? (
            <EmptyState title="No action plan generated yet" message="Submit incident context to receive recommended actions and escalation guidance." />
          ) : null}
          {recommendation ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <StatusBadge label={`Priority: ${recommendation.priority_level}`} tone={recommendation.priority_level === "critical" ? "critical" : recommendation.priority_level === "high" ? "danger" : "warning"} />
                <StatusBadge label={`Zones: ${recommendation.affected_zones.join(", ")}`} tone="neutral" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard label="Resolution target" value={`${recommendation.estimated_resolution_minutes} min`} helperText="Operational response estimate." />
                <MetricCard label="Incident severity" value={severity} helperText={incidentType} />
              </div>
              <ActionList title="Recommended staff actions" items={recommendation.recommended_actions} />
              <div className="space-y-3 text-sm leading-6 text-stadium-primary">
                <p className="rounded-lg bg-stadium-surface p-4"><span className="font-semibold">Staff coordination:</span> {recommendation.staff_coordination_note}</p>
                <p className="rounded-lg bg-stadium-danger/10 p-4 text-stadium-danger"><span className="font-semibold">Escalation trigger:</span> {recommendation.safety_escalation_trigger}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
