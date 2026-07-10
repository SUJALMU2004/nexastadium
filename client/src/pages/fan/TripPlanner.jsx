import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import FormField from "../../components/common/FormField.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { ACCESSIBILITY_NEED_OPTIONS, ARRIVAL_TIME_OPTIONS, TRANSPORT_MODE_OPTIONS } from "../../utils/constants.js";

/**
 * Render a deterministic match day trip planner from selected stadium data.
 *
 * @returns {JSX.Element} Trip planner page.
 */
export default function TripPlanner() {
  const { t } = useTranslation();
  const { activeStadium, activeStadiumName } = useContext(StadiumContext);
  const [arrivalWindow, setArrivalWindow] = useState(ARRIVAL_TIME_OPTIONS[1]);
  const [transportMode, setTransportMode] = useState(TRANSPORT_MODE_OPTIONS[0]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(ACCESSIBILITY_NEED_OPTIONS[0]);
  const [tripPlan, setTripPlan] = useState(null);

  /**
   * Build a local trip plan using cached venue transport and accessibility data.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {void}
   */
  function handleTripPlanSubmit(submitEvent) {
    submitEvent.preventDefault();
    const firstMetroOption = activeStadium.transport_options?.metro?.[0] || "the primary rail connection";
    const firstBusOption = activeStadium.transport_options?.bus?.[0] || "the venue shuttle bus";
    const firstAccessibleEntry = activeStadium.accessibility_features?.wheelchair_access_points?.[0] || "the signed accessible entry point";
    const rideshareDropoff = activeStadium.transport_options?.rideshare_dropoff || "the signed rideshare drop-off";
    const firstFoodZone = activeStadium.food_zones?.[0]?.zone_name || "the main concourse food zone";

    setTripPlan({
      summary: `${arrivalWindow} is recommended for ${activeStadiumName} when using ${transportMode}.`,
      steps: [
        `Arrive via ${transportMode === "Bus" ? firstBusOption : firstMetroOption} and follow FIFA World Cup 2026 venue signage to security screening.`,
        `Use ${firstAccessibleEntry} if ${accessibilityNeeds.toLowerCase()} applies or if concourse crowding is elevated.`,
        `After screening, move toward ${firstFoodZone} only after confirming your seating section and nearest restroom.`,
        `For post-match departure, avoid stopping in gate corridors and continue toward ${rideshareDropoff} or the designated transit plaza.`
      ],
      gateAdvice: arrivalWindow.includes("3 hours") || arrivalWindow.includes("2 hours")
        ? "Early arrival keeps screening queues manageable and gives fans more time to resolve ticket or accessibility questions."
        : "Late arrival increases queue risk. Prioritize the closest open gate and keep bags ready for screening.",
      accessibilityAdvice: accessibilityNeeds === "None"
        ? "No additional accessibility routing selected. Keep accessible lanes clear for fans who need them."
        : `${accessibilityNeeds} selected. Build extra transfer time and ask venue staff before entering stairs or high-density concourse areas.`
    });
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.fan")}
        title={t("tripPlanner.title")}
        description={`Plan arrival, entry, in-stadium movement, and post-match departure for ${activeStadiumName} using the local World Cup venue dataset.`}
      >
        <StadiumSelector id="trip-planner-stadium-selector" label="Trip venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card title="Trip Inputs" description="Set the fan journey constraints for the selected stadium.">
          <form className="space-y-4" onSubmit={handleTripPlanSubmit}>
            <FormField label="Arrival window" htmlFor="trip-arrival-window">
              <select
                id="trip-arrival-window"
                aria-label="Arrival window"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={arrivalWindow}
                onChange={(changeEvent) => setArrivalWindow(changeEvent.target.value)}
              >
                {ARRIVAL_TIME_OPTIONS.map((arrivalOption) => (
                  <option key={arrivalOption} value={arrivalOption}>{arrivalOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Transport mode" htmlFor="trip-transport-mode">
              <select
                id="trip-transport-mode"
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
            <FormField label="Accessibility context" htmlFor="trip-accessibility-needs">
              <select
                id="trip-accessibility-needs"
                aria-label="Accessibility context"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={accessibilityNeeds}
                onChange={(changeEvent) => setAccessibilityNeeds(changeEvent.target.value)}
              >
                {ACCESSIBILITY_NEED_OPTIONS.map((needOption) => (
                  <option key={needOption} value={needOption}>{needOption}</option>
                ))}
              </select>
            </FormField>
            <button
              type="submit"
              aria-label="Generate match day trip plan"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary"
            >
              Generate trip plan
            </button>
          </form>
        </Card>

        <Card title="Match Day Plan" description="Deterministic planning output for the selected stadium.">
          {!tripPlan ? (
            <EmptyState title="No trip plan generated yet" message="Submit the trip inputs to produce arrival, entry, and exit guidance." />
          ) : (
            <div className="space-y-5">
              <MetricCard label="Trip summary" value={transportMode} helperText={tripPlan.summary} />
              <ActionList title="Recommended sequence" items={tripPlan.steps} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary">{tripPlan.gateAdvice}</div>
                <div className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary">{tripPlan.accessibilityAdvice}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
