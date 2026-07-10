import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ScenarioSelector from "../../components/common/ScenarioSelector.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";

/**
 * Render the open operations command dashboard with scenario controls.
 *
 * @returns {JSX.Element} Operations dashboard page.
 */
export default function OpsDashboard() {
  const { t } = useTranslation();
  const { activeStadiumName, activeStadiumCity, activeScenarioDetails } = useContext(StadiumContext);
  const crowdDensityPercentage = activeScenarioDetails?.crowd_density_percentage || 75;
  const priorityTone = crowdDensityPercentage >= 85 ? "danger" : crowdDensityPercentage >= 70 ? "warning" : "success";
  const priorityLabel = crowdDensityPercentage >= 85 ? "High crowd priority" : crowdDensityPercentage >= 70 ? "Managed surge" : "Stable";
  const estimatedResolutionMinutes = Math.max(15, Math.round(crowdDensityPercentage / 2));
  const affectedZones = activeScenarioDetails?.affected_zones || ["Perimeter gates", "Main concourse"];
  const recommendedActions = activeScenarioDetails?.recommended_actions || [
    "Open additional steward lanes at the busiest fan approach.",
    "Keep accessible entry routes unobstructed.",
    "Prepare a calm PA update if queues exceed ten minutes."
  ];

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("opsDashboard.title")}
        description={`Coordinate FIFA World Cup 2026 crowd operations for ${activeStadiumName} in ${activeStadiumCity}. The portal stays open so venue teams can move quickly between match-day workflows.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="ops-dashboard-stadium-selector" label="Command venue" />
          <ScenarioSelector id="ops-dashboard-scenario-selector" label="Active scenario" />
        </div>
      </PageHeader>

      <div className="mb-6">
        <StatusBadge label={priorityLabel} tone={priorityTone} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Crowd density" value={`${crowdDensityPercentage}%`} helperText="Scenario-level density from operations data." />
        <MetricCard label="Affected zones" value={affectedZones.length} helperText={affectedZones.join(", ")} />
        <MetricCard label="Resolution estimate" value={`${estimatedResolutionMinutes} min`} helperText="Planning target for staff response." />
        <MetricCard label="Operations mode" value="Open" helperText="Fan, Ops, and Transit workflows are available for rapid coordination." />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card
          title={activeScenarioDetails?.name || "Match Entry Surge"}
          description={activeScenarioDetails?.description || "75,000 fans arriving two hours before kickoff across perimeter gates and transit plazas."}
        >
          <ActionList title="Recommended command actions" items={recommendedActions} />
        </Card>

        <Card title="Ops Quick Links" description="Move from scenario monitoring into the action workflow.">
          <div className="grid gap-3">
            <NavLink
              to="/ops/incidents"
              aria-label="Open Incident Management"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Incident Management & AI Response
            </NavLink>
            <NavLink
              to="/ops/announcements"
              aria-label="Open PA Announcement Generator"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              AI-Powered PA Announcement Generator
            </NavLink>
            <NavLink
              to="/ops/simulator"
              aria-label="Open crowd risk simulator"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Crowd Risk Simulator
            </NavLink>
            <NavLink
              to="/ops/briefing"
              aria-label="Open match-day briefing"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Match-Day Briefing
            </NavLink>
            <NavLink
              to="/ops/reports"
              aria-label="Open operations reports"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Operations Reports
            </NavLink>
            <NavLink
              to="/transit/egress"
              aria-label="Open Post-Match Egress Planner"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Post-Match Egress Planner
            </NavLink>
            <NavLink
              to="/transit/flow-control"
              aria-label="Open transit flow-control planner"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Transit Flow-Control Planner
            </NavLink>
          </div>
          <p className="mt-4 rounded-lg bg-stadium-surface p-3 text-sm leading-6 text-stadium-primary">
            Volunteer coordination: assign roving teams to {affectedZones[0]} first, then redeploy to information desks once queue pressure falls.
          </p>
        </Card>
      </div>
    </section>
  );
}
