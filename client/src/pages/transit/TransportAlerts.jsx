import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { fetchTransportAlerts } from "../../services/transitService.js";

/**
 * Render stadium transport alerts with severity and actions.
 *
 * @returns {JSX.Element} Transport alerts page.
 */
export default function TransportAlerts() {
  const { t } = useTranslation();
  const { activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [transportAlerts, setTransportAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState("");

  /**
   * Load stadium-specific transport alerts from the local backend service.
   *
   * @returns {Promise<void>} Resolves after alert state updates.
   */
  async function loadTransportAlerts() {
    setIsLoadingAlerts(true);
    setAlertsError("");

    try {
      const transportAlertsResponse = await fetchTransportAlerts(activeStadiumId);
      setTransportAlerts(transportAlertsResponse.alerts || []);
    } catch (caughtError) {
      setAlertsError(caughtError.message || "Transport alerts could not be loaded.");
    } finally {
      setIsLoadingAlerts(false);
    }
  }

  useEffect(() => {
    loadTransportAlerts();
  }, [activeStadiumId]);

  /**
   * Map backend severity text to a visible badge tone.
   *
   * @param {string} severity - Alert severity from the transit service.
   * @returns {"neutral"|"success"|"warning"|"danger"|"critical"} Badge tone.
   */
  function getAlertTone(severity) {
    const normalizedSeverity = severity.toLowerCase();
    if (normalizedSeverity.includes("critical")) {
      return "critical";
    }
    if (normalizedSeverity.includes("high")) {
      return "danger";
    }
    if (normalizedSeverity.includes("medium")) {
      return "warning";
    }
    return "neutral";
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.transit")}
        title={t("transportAlerts.title")}
        description={`Review transport alerts for ${activeStadiumName}, including rail, bus, rideshare, parking, and accessible travel advisories.`}
      >
        <StadiumSelector id="transport-alerts-stadium-selector" label="Alert venue" />
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-stadium-primary/70">Alerts refresh from the local stadium operations backend; no live transit agency feed is required.</p>
        <button
          type="button"
          aria-label="Refresh transport alerts"
          className="rounded-md border border-stadium-primary/20 px-4 py-2 text-sm font-semibold text-stadium-primary"
          onClick={loadTransportAlerts}
        >
          Refresh alerts
        </button>
      </div>

      <ErrorMessage message={alertsError} />
      {isLoadingAlerts ? <LoadingSpinner message="Loading transport alerts" /> : null}
      {!isLoadingAlerts && transportAlerts.length === 0 ? (
        <EmptyState title="No transport alerts loaded" message="Select a stadium or refresh alerts to load service notices." />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {transportAlerts.map((transportAlert) => (
          <Card key={`${transportAlert.title}-${transportAlert.affected_transport_mode}`} title={transportAlert.title} description={transportAlert.message}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={transportAlert.severity} tone={getAlertTone(transportAlert.severity)} />
                <StatusBadge label={transportAlert.affected_transport_mode} tone="neutral" />
              </div>
              <p className="text-sm leading-6 text-stadium-primary">
                <span className="font-semibold">Recommended action:</span> {transportAlert.recommended_action}
              </p>
              <p className="text-xs font-semibold uppercase tracking-normal text-stadium-primary/60">
                Last updated: {transportAlert.last_updated}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
