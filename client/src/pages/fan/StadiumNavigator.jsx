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
import { getNavigationGuidance } from "../../services/aiService.js";
import {
  ACCESSIBILITY_NEED_OPTIONS,
  STADIUM_FROM_LOCATION_OPTIONS,
  STADIUM_TO_LOCATION_OPTIONS
} from "../../utils/constants.js";

/**
 * Render the stadium wayfinding workflow backed by deterministic AI guidance.
 *
 * @returns {JSX.Element} Stadium navigator page.
 */
export default function StadiumNavigator() {
  const { t } = useTranslation();
  const { activeStadiumId, activeStadiumName, selectedLanguage } = useContext(StadiumContext);
  const [fromLocation, setFromLocation] = useState(STADIUM_FROM_LOCATION_OPTIONS[0]);
  const [toLocation, setToLocation] = useState(STADIUM_TO_LOCATION_OPTIONS[0]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(ACCESSIBILITY_NEED_OPTIONS[0]);
  const [navigationGuidance, setNavigationGuidance] = useState(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [guidanceError, setGuidanceError] = useState("");

  /**
   * Request route guidance from the backend AI service.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after guidance is loaded.
   */
  async function handleNavigationSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsLoadingGuidance(true);
    setGuidanceError("");

    try {
      const guidanceResponse = await getNavigationGuidance({
        from_location: fromLocation,
        to_location: toLocation,
        accessibility_needs: accessibilityNeeds,
        stadium_id: activeStadiumId,
        language: selectedLanguage
      });
      setNavigationGuidance(guidanceResponse);
    } catch (caughtError) {
      setGuidanceError(caughtError.message || "Navigation guidance could not be generated.");
    } finally {
      setIsLoadingGuidance(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.fan")}
        title={t("stadiumNavigator.title")}
        description={`Generate step-by-step movement guidance for ${activeStadiumName}, including mobility-aware alternatives for FIFA World Cup 2026 fans.`}
      >
        <StadiumSelector id="navigator-stadium-selector" label="Wayfinding venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card title="Route Request" description="Choose the starting point, destination, and accessibility context.">
          <form className="space-y-4" onSubmit={handleNavigationSubmit}>
            <FormField label="From location" htmlFor="navigator-from-location">
              <select
                id="navigator-from-location"
                aria-label="From location"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={fromLocation}
                onChange={(changeEvent) => setFromLocation(changeEvent.target.value)}
              >
                {STADIUM_FROM_LOCATION_OPTIONS.map((locationOption) => (
                  <option key={locationOption} value={locationOption}>{locationOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="To location" htmlFor="navigator-to-location">
              <select
                id="navigator-to-location"
                aria-label="To location"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={toLocation}
                onChange={(changeEvent) => setToLocation(changeEvent.target.value)}
              >
                {STADIUM_TO_LOCATION_OPTIONS.map((locationOption) => (
                  <option key={locationOption} value={locationOption}>{locationOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Accessibility needs" htmlFor="navigator-accessibility-needs">
              <select
                id="navigator-accessibility-needs"
                aria-label="Accessibility needs"
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
              aria-label="Generate stadium navigation guidance"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingGuidance}
            >
              Generate route
            </button>
          </form>
        </Card>

        <Card title="Route Guidance" description="Phase 3 returns deterministic, stadium-safe directions without external calls when the AI gateway is unavailable.">
          <ErrorMessage message={guidanceError} />
          {isLoadingGuidance ? <LoadingSpinner message="Generating navigation guidance" /> : null}
          {!isLoadingGuidance && !navigationGuidance ? (
            <EmptyState title="No route generated yet" message="Submit the route request to receive stadium wayfinding steps." />
          ) : null}
          {navigationGuidance ? (
            <div className="space-y-5">
              <MetricCard label="Estimated walking time" value={`${navigationGuidance.estimated_minutes} min`} helperText={`From ${fromLocation} to ${toLocation}.`} />
              <ActionList title="Step-by-step directions" items={navigationGuidance.steps} />
              <div className="rounded-lg bg-stadium-surface p-4 text-sm leading-6 text-stadium-primary">
                <p><span className="font-semibold">Accessibility notes:</span> {navigationGuidance.accessibility_notes}</p>
                {navigationGuidance.alternative_route ? (
                  <p className="mt-2"><span className="font-semibold">Alternative route:</span> {navigationGuidance.alternative_route}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
