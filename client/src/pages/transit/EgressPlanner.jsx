import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { requestEgressPlan } from "../../services/transitService.js";
import { ACCESSIBILITY_NEED_OPTIONS, CROWD_INTENSITY_OPTIONS, TRANSPORT_MODE_OPTIONS } from "../../utils/constants.js";

/**
 * Render the post-match egress planning workflow for stadium operations teams.
 *
 * @returns {JSX.Element} Egress planner page.
 */
export default function EgressPlanner() {
  const { t } = useTranslation();
  const { activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [crowdIntensity, setCrowdIntensity] = useState("Very busy");
  const [transportMode, setTransportMode] = useState(TRANSPORT_MODE_OPTIONS[0]);
  const [accessibilityPriority, setAccessibilityPriority] = useState(ACCESSIBILITY_NEED_OPTIONS[0]);
  const [egressPlan, setEgressPlan] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [egressError, setEgressError] = useState("");

  /**
   * Request a deterministic post-match exit strategy.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after egress plan state updates.
   */
  async function handleEgressPlanSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsLoadingPlan(true);
    setEgressError("");

    try {
      const egressPlanResponse = await requestEgressPlan({
        stadium_id: activeStadiumId,
        crowd_intensity: crowdIntensity,
        transport_mode: transportMode,
        accessibility_priority: accessibilityPriority
      });
      setEgressPlan(egressPlanResponse);
    } catch (caughtError) {
      setEgressError(caughtError.message || "The post-match egress plan could not be generated.");
    } finally {
      setIsLoadingPlan(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.transit")}
        title={t("egressPlanner.title")}
        description={`Generate a controlled post-match exit strategy for ${activeStadiumName}, balancing gates, transit connections, rideshare, and accessible pickup points.`}
      >
        <StadiumSelector id="egress-stadium-selector" label="Egress venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card title="Egress Inputs" description="Set the expected crowd and transport pressure for full-time operations.">
          <form className="space-y-4" onSubmit={handleEgressPlanSubmit}>
            <FormField label="Crowd intensity" htmlFor="egress-crowd-intensity">
              <select
                id="egress-crowd-intensity"
                aria-label="Crowd intensity"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={crowdIntensity}
                onChange={(changeEvent) => setCrowdIntensity(changeEvent.target.value)}
              >
                {CROWD_INTENSITY_OPTIONS.map((intensityOption) => (
                  <option key={intensityOption} value={intensityOption}>{intensityOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Primary transport mode" htmlFor="egress-transport-mode">
              <select
                id="egress-transport-mode"
                aria-label="Primary transport mode"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={transportMode}
                onChange={(changeEvent) => setTransportMode(changeEvent.target.value)}
              >
                {TRANSPORT_MODE_OPTIONS.map((modeOption) => (
                  <option key={modeOption} value={modeOption}>{modeOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Accessibility priority" htmlFor="egress-accessibility-priority">
              <select
                id="egress-accessibility-priority"
                aria-label="Accessibility priority"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={accessibilityPriority}
                onChange={(changeEvent) => setAccessibilityPriority(changeEvent.target.value)}
              >
                {ACCESSIBILITY_NEED_OPTIONS.map((needOption) => (
                  <option key={needOption} value={needOption}>{needOption}</option>
                ))}
              </select>
            </FormField>
            <button
              type="submit"
              aria-label="Generate post-match egress plan"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingPlan}
            >
              Generate egress plan
            </button>
          </form>
        </Card>

        <Card title="Exit Strategy" description="Stadium-specific deterministic output for Phase 3 evaluation.">
          <ErrorMessage message={egressError} />
          {isLoadingPlan ? <LoadingSpinner message="Generating egress plan" /> : null}
          {!isLoadingPlan && !egressPlan ? (
            <EmptyState title="No egress plan generated yet" message="Submit the egress inputs to receive a controlled departure strategy." />
          ) : null}
          {egressPlan ? (
            <div className="space-y-5">
              <MetricCard label="Estimated clearance" value={`${egressPlan.estimated_clearance_minutes} min`} helperText={crowdIntensity} />
              <ActionList title="Recommended gates" items={egressPlan.recommended_gates} />
              <div className="grid gap-3">
                <p className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary"><span className="font-semibold">Exit strategy:</span> {egressPlan.exit_strategy}</p>
                <p className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary"><span className="font-semibold">Transport notes:</span> {egressPlan.transport_notes}</p>
                <p className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary"><span className="font-semibold">Crowd distribution:</span> {egressPlan.crowd_distribution_advice}</p>
                <p className="rounded-lg bg-stadium-green/10 p-4 text-sm leading-6 text-stadium-primary"><span className="font-semibold">Accessibility:</span> {egressPlan.accessibility_note}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
