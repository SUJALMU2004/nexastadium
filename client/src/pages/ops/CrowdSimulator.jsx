import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../components/common/Card.jsx";
import ComparisonTable from "../../components/common/ComparisonTable.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ScenarioSelector from "../../components/common/ScenarioSelector.jsx";
import RiskMeter from "../../components/common/RiskMeter.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import ActionList from "../../components/common/ActionList.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { requestCrowdRisk, requestScenarioComparison } from "../../services/simulationService.js";
import {
  ACCESSIBILITY_DEMAND_OPTIONS,
  SCENARIO_TYPES,
  TRANSIT_PRESSURE_OPTIONS,
  WEATHER_CONDITION_OPTIONS
} from "../../utils/constants.js";

/**
 * Render crowd risk and scenario comparison simulation workflows.
 *
 * @returns {JSX.Element} Crowd simulator page.
 */
export default function CrowdSimulator() {
  const { t } = useTranslation();
  const { activeStadium, activeStadiumId, activeStadiumName, activeScenario, scenarioList } = useContext(StadiumContext);
  const [expectedAttendance, setExpectedAttendance] = useState(activeStadium.capacity || 80000);
  const [gateOpenMinutes, setGateOpenMinutes] = useState(120);
  const [weatherCondition, setWeatherCondition] = useState("Clear");
  const [transitPressure, setTransitPressure] = useState("Medium");
  const [accessibilityDemand, setAccessibilityDemand] = useState("Standard");
  const [comparisonScenarioId, setComparisonScenarioId] = useState("POST_MATCH_EGRESS");
  const [crowdRiskResponse, setCrowdRiskResponse] = useState(null);
  const [scenarioComparisonResponse, setScenarioComparisonResponse] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatorError, setSimulatorError] = useState("");

  const selectableScenarios = useMemo(
    () => (scenarioList.length ? scenarioList : SCENARIO_TYPES.map((scenarioId) => ({ id: scenarioId, name: scenarioId.replaceAll("_", " ") }))),
    [scenarioList]
  );

  /**
   * Submit the crowd simulation and scenario comparison request.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after simulation responses update.
   */
  async function handleSimulatorSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsSimulating(true);
    setSimulatorError("");

    try {
      const [crowdRiskResult, scenarioComparisonResult] = await Promise.all([
        requestCrowdRisk({
          stadium_id: activeStadiumId,
          scenario_id: activeScenario,
          expected_attendance: Number(expectedAttendance),
          gate_open_minutes: Number(gateOpenMinutes),
          weather_condition: weatherCondition,
          transit_pressure: transitPressure,
          accessibility_demand: accessibilityDemand
        }),
        requestScenarioComparison({
          stadium_id: activeStadiumId,
          primary_scenario_id: activeScenario,
          comparison_scenario_id: comparisonScenarioId
        })
      ]);

      setCrowdRiskResponse(crowdRiskResult);
      setScenarioComparisonResponse(scenarioComparisonResult);
    } catch (caughtError) {
      setSimulatorError(caughtError.message || "The crowd simulation could not be generated.");
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("crowdSimulator.title")}
        description={`Model FIFA World Cup 2026 crowd risk and compare operational scenarios for ${activeStadiumName}.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="simulator-stadium-selector" label="Simulation venue" />
          <ScenarioSelector id="simulator-scenario-selector" label="Primary scenario" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Simulation Inputs" description="Use venue planning assumptions when live crowd feeds are not connected.">
          <form className="space-y-4" onSubmit={handleSimulatorSubmit}>
            <FormField label="Expected attendance" htmlFor="simulator-attendance">
              <input
                id="simulator-attendance"
                aria-label="Expected attendance"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                min="0"
                type="number"
                value={expectedAttendance}
                onChange={(changeEvent) => setExpectedAttendance(changeEvent.target.value)}
              />
            </FormField>
            <FormField label="Gate open minutes before kickoff" htmlFor="simulator-gate-minutes">
              <input
                id="simulator-gate-minutes"
                aria-label="Gate open minutes before kickoff"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                min="0"
                type="number"
                value={gateOpenMinutes}
                onChange={(changeEvent) => setGateOpenMinutes(changeEvent.target.value)}
              />
            </FormField>
            <FormField label="Weather condition" htmlFor="simulator-weather">
              <select
                id="simulator-weather"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Transit pressure" htmlFor="simulator-transit-pressure">
                <select
                  id="simulator-transit-pressure"
                  aria-label="Transit pressure"
                  className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                  value={transitPressure}
                  onChange={(changeEvent) => setTransitPressure(changeEvent.target.value)}
                >
                  {TRANSIT_PRESSURE_OPTIONS.map((pressureOption) => (
                    <option key={pressureOption} value={pressureOption}>{pressureOption}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Accessibility demand" htmlFor="simulator-accessibility-demand">
                <select
                  id="simulator-accessibility-demand"
                  aria-label="Accessibility demand"
                  className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                  value={accessibilityDemand}
                  onChange={(changeEvent) => setAccessibilityDemand(changeEvent.target.value)}
                >
                  {ACCESSIBILITY_DEMAND_OPTIONS.map((demandOption) => (
                    <option key={demandOption} value={demandOption}>{demandOption}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Compare against scenario" htmlFor="simulator-comparison-scenario">
              <select
                id="simulator-comparison-scenario"
                aria-label="Compare against scenario"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={comparisonScenarioId}
                onChange={(changeEvent) => setComparisonScenarioId(changeEvent.target.value)}
              >
                {selectableScenarios.map((scenarioRecord) => (
                  <option key={scenarioRecord.id} value={scenarioRecord.id}>{scenarioRecord.name}</option>
                ))}
              </select>
            </FormField>
            <button
              type="submit"
              aria-label="Run crowd simulation"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSimulating}
            >
              Run simulator
            </button>
          </form>
        </Card>

        <Card title="Simulation Output" description="Risk scores include text labels and recommended actions for venue command review.">
          <div aria-live="polite" className="space-y-5">
            <ErrorMessage message={simulatorError} />
            {isSimulating ? <LoadingSpinner message="Running crowd simulation" /> : null}
            {!isSimulating && !crowdRiskResponse ? (
              <EmptyState title="No simulation run yet" message="Submit the scenario assumptions to generate crowd risk and comparison outputs." />
            ) : null}
            {crowdRiskResponse ? (
              <>
                <RiskMeter score={crowdRiskResponse.risk_score} level={crowdRiskResponse.risk_level} label={`${activeStadiumName} crowd risk`} />
                <ActionList title="Contributing factors" items={crowdRiskResponse.contributing_factors} />
                <ActionList title="Recommended actions" items={crowdRiskResponse.recommended_actions} />
                <p className="rounded-lg bg-stadium-green/10 p-4 text-sm leading-6 text-stadium-primary">
                  <span className="font-semibold">Accessibility:</span> {crowdRiskResponse.accessibility_note}
                </p>
              </>
            ) : null}
            {scenarioComparisonResponse ? (
              <div className="space-y-4">
                <ComparisonTable items={scenarioComparisonResponse.comparison_items} />
                <p className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary">
                  <span className="font-semibold">Command recommendation:</span> {scenarioComparisonResponse.command_recommendation}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
