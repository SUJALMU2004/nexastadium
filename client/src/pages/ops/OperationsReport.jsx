import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ReportPreview from "../../components/common/ReportPreview.jsx";
import ScenarioSelector from "../../components/common/ScenarioSelector.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { requestOperationsSummary } from "../../services/reportService.js";
import { SUSTAINABILITY_REPORT_FOCUS_OPTIONS } from "../../utils/constants.js";

/**
 * Render the Markdown operations report builder.
 *
 * @returns {JSX.Element} Operations report page.
 */
export default function OperationsReport() {
  const { t } = useTranslation();
  const { activeScenario, activeStadium, activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [attendanceEstimate, setAttendanceEstimate] = useState(activeStadium.capacity || 80000);
  const [incidentSummary, setIncidentSummary] = useState("");
  const [sustainabilityFocus, setSustainabilityFocus] = useState(SUSTAINABILITY_REPORT_FOCUS_OPTIONS[0]);
  const [transportStatus, setTransportStatus] = useState("Transit operating with managed queues");
  const [operationsReport, setOperationsReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Markdown");

  /**
   * Submit report inputs to the backend report service.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after report state updates.
   */
  async function handleReportSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (incidentSummary.length > 1000) {
      setReportError("Incident summary must stay under 1,000 characters.");
      return;
    }

    setIsLoadingReport(true);
    setReportError("");
    setCopyLabel("Copy Markdown");

    try {
      const generatedReport = await requestOperationsSummary({
        stadium_id: activeStadiumId,
        scenario_id: activeScenario,
        attendance_estimate: Number(attendanceEstimate),
        incident_summary: incidentSummary,
        sustainability_focus: sustainabilityFocus,
        transport_status: transportStatus
      });
      setOperationsReport(generatedReport);
    } catch (caughtError) {
      setReportError(caughtError.message || "The operations report could not be generated.");
    } finally {
      setIsLoadingReport(false);
    }
  }

  /**
   * Copy the generated Markdown report to the clipboard.
   *
   * @returns {Promise<void>} Resolves after copy attempt.
   */
  async function handleCopyReport() {
    if (operationsReport?.markdown && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(operationsReport.markdown);
      setCopyLabel("Copied");
    }
  }

  /**
   * Download the generated Markdown report in the browser.
   *
   * @returns {void}
   */
  function handleDownloadReport() {
    if (!operationsReport?.markdown) {
      return;
    }

    const reportBlob = new Blob([operationsReport.markdown], { type: "text/markdown" });
    const reportUrl = URL.createObjectURL(reportBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = reportUrl;
    downloadLink.download = `${activeStadiumId}-operations-summary.md`;
    downloadLink.click();
    URL.revokeObjectURL(reportUrl);
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("operationsReport.title")}
        description={`Build a copyable FIFA World Cup 2026 operations report for ${activeStadiumName}; nothing is stored server-side.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="report-stadium-selector" label="Report venue" />
          <ScenarioSelector id="report-scenario-selector" label="Scenario context" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card title="Report Inputs" description="Use concise, non-personal operational notes for the generated Markdown report.">
          <form className="space-y-4" onSubmit={handleReportSubmit}>
            <FormField label="Attendance estimate" htmlFor="report-attendance">
              <input
                id="report-attendance"
                aria-label="Attendance estimate"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                min="0"
                type="number"
                value={attendanceEstimate}
                onChange={(changeEvent) => setAttendanceEstimate(changeEvent.target.value)}
              />
            </FormField>
            <FormField label="Sustainability focus" htmlFor="report-sustainability-focus">
              <select
                id="report-sustainability-focus"
                aria-label="Sustainability focus"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={sustainabilityFocus}
                onChange={(changeEvent) => setSustainabilityFocus(changeEvent.target.value)}
              >
                {SUSTAINABILITY_REPORT_FOCUS_OPTIONS.map((focusOption) => (
                  <option key={focusOption} value={focusOption}>{focusOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Transport status" htmlFor="report-transport-status">
              <input
                id="report-transport-status"
                aria-label="Transport status"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={transportStatus}
                onChange={(changeEvent) => setTransportStatus(changeEvent.target.value)}
              />
            </FormField>
            <FormField label="Incident summary" htmlFor="report-incident-summary" helpText={`${incidentSummary.length}/1000 characters. Avoid personal data.`}>
              <textarea
                id="report-incident-summary"
                aria-label="Incident summary"
                className="min-h-28 w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                maxLength={1000}
                value={incidentSummary}
                onChange={(changeEvent) => setIncidentSummary(changeEvent.target.value)}
              />
            </FormField>
            <button
              type="submit"
              aria-label="Generate operations report"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingReport}
            >
              Generate report
            </button>
          </form>
        </Card>

        <Card title="Report Preview" description="Preview, copy, or download the Markdown report for the demo.">
          <div aria-live="polite" className="space-y-5">
            <ErrorMessage message={reportError} />
            {isLoadingReport ? <LoadingSpinner message="Generating operations report" /> : null}
            {!isLoadingReport && !operationsReport ? (
              <EmptyState title="No report generated yet" message="Submit report inputs to create the operations summary." />
            ) : null}
            {operationsReport ? (
              <>
                <ActionList title="Operational priorities" items={operationsReport.operational_priorities} />
                <ActionList title="Staff actions" items={operationsReport.staff_actions} />
                <ReportPreview
                  title={operationsReport.report_title}
                  markdown={operationsReport.markdown}
                  onCopy={handleCopyReport}
                  onDownload={handleDownloadReport}
                  copyLabel={copyLabel}
                />
              </>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
