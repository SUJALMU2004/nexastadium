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
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { requestRouteRecommendation } from "../../services/transitService.js";
import {
  ROUTE_ARRIVAL_PREFERENCE_OPTIONS,
  ROUTE_STARTING_POINT_OPTIONS,
  TRANSPORT_MODE_OPTIONS
} from "../../utils/constants.js";

/**
 * Render the smart route recommendation workflow for fans and transit teams.
 *
 * @returns {JSX.Element} Route recommender page.
 */
export default function RouteRecommender() {
  const { t } = useTranslation();
  const { activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [startingPointType, setStartingPointType] = useState(ROUTE_STARTING_POINT_OPTIONS[0]);
  const [transportMode, setTransportMode] = useState(TRANSPORT_MODE_OPTIONS[0]);
  const [arrivalPreference, setArrivalPreference] = useState(ROUTE_ARRIVAL_PREFERENCE_OPTIONS[0]);
  const [routeRecommendation, setRouteRecommendation] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");

  /**
   * Request deterministic route recommendation from the backend transit service.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after route recommendation state updates.
   */
  async function handleRouteSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsLoadingRoute(true);
    setRouteError("");

    try {
      const routeRecommendationResponse = await requestRouteRecommendation({
        stadium_id: activeStadiumId,
        starting_point_type: startingPointType,
        transport_mode: transportMode,
        arrival_preference: arrivalPreference
      });
      setRouteRecommendation(routeRecommendationResponse);
    } catch (caughtError) {
      setRouteError(caughtError.message || "The route recommendation could not be generated.");
    } finally {
      setIsLoadingRoute(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.transit")}
        title={t("routeRecommender.title")}
        description={`Recommend a safer, clearer path to ${activeStadiumName} using deterministic World Cup venue transport options.`}
      >
        <StadiumSelector id="route-stadium-selector" label="Route venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card title="Route Inputs" description="Select where the fan journey starts and what the route should optimize.">
          <form className="space-y-4" onSubmit={handleRouteSubmit}>
            <FormField label="Starting point" htmlFor="route-starting-point">
              <select
                id="route-starting-point"
                aria-label="Starting point"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={startingPointType}
                onChange={(changeEvent) => setStartingPointType(changeEvent.target.value)}
              >
                {ROUTE_STARTING_POINT_OPTIONS.map((startingPointOption) => (
                  <option key={startingPointOption} value={startingPointOption}>{startingPointOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Transport mode" htmlFor="route-transport-mode">
              <select
                id="route-transport-mode"
                aria-label="Transport mode"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={transportMode}
                onChange={(changeEvent) => setTransportMode(changeEvent.target.value)}
              >
                {TRANSPORT_MODE_OPTIONS.map((modeOption) => (
                  <option key={modeOption} value={modeOption}>{modeOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Arrival preference" htmlFor="route-arrival-preference">
              <select
                id="route-arrival-preference"
                aria-label="Arrival preference"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={arrivalPreference}
                onChange={(changeEvent) => setArrivalPreference(changeEvent.target.value)}
              >
                {ROUTE_ARRIVAL_PREFERENCE_OPTIONS.map((preferenceOption) => (
                  <option key={preferenceOption} value={preferenceOption}>{preferenceOption}</option>
                ))}
              </select>
            </FormField>
            <button
              type="submit"
              aria-label="Generate smart route recommendation"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingRoute}
            >
              Generate recommendation
            </button>
          </form>
        </Card>

        <Card title="Recommended Route" description="Phase 3 returns local guidance only; no real transit API is called.">
          <ErrorMessage message={routeError} />
          {isLoadingRoute ? <LoadingSpinner message="Generating route recommendation" /> : null}
          {!isLoadingRoute && !routeRecommendation ? (
            <EmptyState title="No route generated yet" message="Submit route inputs to receive a stadium-specific recommendation." />
          ) : null}
          {routeRecommendation ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <StatusBadge label={`Crowd level: ${routeRecommendation.crowd_level}`} tone={routeRecommendation.crowd_level === "High" ? "danger" : "warning"} />
                <StatusBadge label={arrivalPreference} tone="neutral" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard label="Estimated time" value={`${routeRecommendation.estimated_minutes} min`} helperText={routeRecommendation.recommended_route} />
                <MetricCard label="Transport mode" value={transportMode} helperText={startingPointType} />
              </div>
              <ActionList title="Route steps" items={routeRecommendation.steps} />
              <div className="grid gap-3">
                <p className="rounded-lg bg-stadium-green/10 p-4 text-sm leading-6 text-stadium-primary"><span className="font-semibold">Accessibility:</span> {routeRecommendation.accessibility_notes}</p>
                <p className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary"><span className="font-semibold">Carbon note:</span> {routeRecommendation.carbon_note}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
