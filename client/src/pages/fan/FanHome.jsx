import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";

/**
 * Render the fan portal landing page with selected-stadium match day guidance.
 *
 * @returns {JSX.Element} Interactive fan home page.
 */
export default function FanHome() {
  const { t } = useTranslation();
  const { activeStadium, activeStadiumName, activeStadiumCity, stadiumError } = useContext(StadiumContext);
  const accessibleZoneCount = activeStadium.zones?.filter((stadiumZone) => stadiumZone.has_wheelchair_access).length || 0;
  const foodZoneCount = activeStadium.food_zones?.length || 0;

  const matchDayActions = [
    `Use the assistant for gate, seating, food, transport, and safety guidance at ${activeStadiumName}.`,
    "Confirm accessible entrances and restrooms before moving through high-density concourse areas.",
    "Review egress recommendations before full-time so exit gates and transit connections are clear."
  ];

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.fan")}
        title={t("fanHome.title")}
        description={`The fan portal turns FIFA World Cup 2026 stadium information into practical match day guidance for ${activeStadiumName} in ${activeStadiumCity}.`}
      >
        <StadiumSelector id="fan-home-stadium-selector" label="Choose match venue" />
      </PageHeader>

      {stadiumError ? (
        <div className="mb-6">
          <StatusBadge label={stadiumError} tone="warning" />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Venue capacity" value={activeStadium.capacity?.toLocaleString() || "87,157"} helperText="Used for crowd guidance and entry pacing." />
        <MetricCard label="Accessible zones" value={accessibleZoneCount} helperText="Zones in the local venue dataset with wheelchair access." />
        <MetricCard label="Food zones" value={foodZoneCount} helperText="Each zone includes halal, vegetarian, and local options." />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="Match Day Guidance" description="Recommended first actions for a smoother FIFA World Cup 2026 stadium visit.">
          <ActionList items={matchDayActions} />
        </Card>

        <Card title="Quick Fan Actions" description="Open the focused workflow you need before or during the match.">
          <div className="grid gap-3">
            <NavLink
              to="/fan/assistant"
              aria-label="Open Stadium AI Assistant"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Stadium AI Assistant
            </NavLink>
            <NavLink
              to="/fan/navigator"
              aria-label="Open Stadium Navigator"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Find Your Way Around the Stadium
            </NavLink>
            <NavLink
              to="/fan/accessibility"
              aria-label="Open Accessibility Services and Support"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Accessibility Services & Support
            </NavLink>
            <NavLink
              to="/fan/safety-guide"
              aria-label="Open multilingual safety support guide"
              className="rounded-md border border-stadium-primary/10 px-4 py-3 font-semibold text-stadium-primary hover:border-stadium-accent hover:bg-stadium-accent/10"
            >
              Multilingual Safety Support Pack
            </NavLink>
          </div>
        </Card>
      </div>
    </section>
  );
}
