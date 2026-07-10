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
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { requestTransitFlowControl } from "../../services/transitService.js";
import { ACCESSIBILITY_DEMAND_OPTIONS, FLOW_TRANSIT_MODE_OPTIONS, RISK_TONE_BY_LEVEL } from "../../utils/constants.js";

/**
 * Render the transit and gate flow-control planner.
 *
 * @returns {JSX.Element} Flow-control page.
 */
export default function FlowControl() {
  const { t } = useTranslation();
  const { activeScenario, activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [inboundRatePerMinute, setInboundRatePerMinute] = useState(1800);
  const [openGateCount, setOpenGateCount] = useState(6);
  const [transitMode, setTransitMode] = useState(FLOW_TRANSIT_MODE_OPTIONS[0]);
  const [accessibilityPriority, setAccessibilityPriority] = useState(ACCESSIBILITY_DEMAND_OPTIONS[0]);
  const [flowControlResponse, setFlowControlResponse] = useState(null);
  const [flowControlError, setFlowControlError] = useState("");
  const [isLoadingFlowControl, setIsLoadingFlowControl] = useState(false);

  /**
   * Submit flow-control assumptions to the backend simulation endpoint.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after flow-control state updates.
   */
  async function handleFlowControlSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsLoadingFlowControl(true);
    setFlowControlError("");

    try {
      const generatedFlowControl = await requestTransitFlowControl({
        stadium_id: activeStadiumId,
        scenario_id: activeScenario,
        inbound_rate_per_minute: Number(inboundRatePerMinute),
        open_gate_count: Number(openGateCount),
        transit_mode: transitMode,
        accessibility_priority: accessibilityPriority
      });
      setFlowControlResponse(generatedFlowControl);
    } catch (caughtError) {
      setFlowControlError(caughtError.message || "The flow-control plan could not be generated.");
    } finally {
      setIsLoadingFlowControl(false);
    }
  }

  const riskTone = RISK_TONE_BY_LEVEL[flowControlResponse?.risk_level] || "warning";

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.transit")}
        title={t("flowControl.title")}
        description={`Plan gate release, transit coordination, and accessible lanes for ${activeStadiumName}.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="flow-control-stadium-selector" label="Flow-control venue" />
          <ScenarioSelector id="flow-control-scenario-selector" label="Scenario context" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Flow-Control Inputs" description="Calculate deterministic gate openings and hold-release timing.">
          <form className="space-y-4" onSubmit={handleFlowControlSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Inbound fans per minute" htmlFor="flow-inbound-rate">
                <input
                  id="flow-inbound-rate"
                  aria-label="Inbound fans per minute"
                  className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                  min="0"
                  type="number"
                  value={inboundRatePerMinute}
                  onChange={(changeEvent) => setInboundRatePerMinute(changeEvent.target.value)}
                />
              </FormField>
              <FormField label="Open gate count" htmlFor="flow-open-gates">
                <input
                  id="flow-open-gates"
                  aria-label="Open gate count"
                  className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                  min="1"
                  type="number"
                  value={openGateCount}
                  onChange={(changeEvent) => setOpenGateCount(changeEvent.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Transit mode" htmlFor="flow-transit-mode">
              <select
                id="flow-transit-mode"
                aria-label="Transit mode"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={transitMode}
                onChange={(changeEvent) => setTransitMode(changeEvent.target.value)}
              >
                {FLOW_TRANSIT_MODE_OPTIONS.map((modeOption) => (
                  <option key={modeOption} value={modeOption}>{modeOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Accessibility priority" htmlFor="flow-accessibility-priority">
              <select
                id="flow-accessibility-priority"
                aria-label="Accessibility priority"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={accessibilityPriority}
                onChange={(changeEvent) => setAccessibilityPriority(changeEvent.target.value)}
              >
                {ACCESSIBILITY_DEMAND_OPTIONS.map((priorityOption) => (
                  <option key={priorityOption} value={priorityOption}>{priorityOption}</option>
                ))}
              </select>
            </FormField>
            <button
              type="submit"
              aria-label="Generate flow-control plan"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingFlowControl}
            >
              Generate flow-control plan
            </button>
          </form>
        </Card>

        <Card title="Flow-Control Output" description="Use this plan to coordinate gates, transit, and accessibility lanes.">
          <div aria-live="polite" className="space-y-5">
            <ErrorMessage message={flowControlError} />
            {isLoadingFlowControl ? <LoadingSpinner message="Generating flow-control plan" /> : null}
            {!isLoadingFlowControl && !flowControlResponse ? (
              <EmptyState title="No flow-control plan generated yet" message="Submit the inputs to create a gate and transit plan." />
            ) : null}
            {flowControlResponse ? (
              <>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge label={`${flowControlResponse.risk_level} flow risk`} tone={riskTone} />
                  <StatusBadge label={`${flowControlResponse.recommended_gate_openings} gates recommended`} tone="neutral" />
                  <StatusBadge label={`${flowControlResponse.hold_release_minutes} min hold-release`} tone="warning" />
                </div>
                <ActionList title="Crowd distribution" items={flowControlResponse.crowd_distribution} />
                <p className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary">
                  <span className="font-semibold">Transit coordination:</span> {flowControlResponse.transit_coordination_note}
                </p>
                <p className="rounded-lg bg-stadium-green/10 p-4 text-sm leading-6 text-stadium-primary">
                  <span className="font-semibold">Accessibility lane:</span> {flowControlResponse.accessibility_lane_note}
                </p>
              </>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
