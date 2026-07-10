import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../components/common/Card.jsx";
import FormField from "../../components/common/FormField.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";

/**
 * Render deterministic sustainability and carbon footprint calculations.
 *
 * @returns {JSX.Element} Sustainability tracker page.
 */
export default function SustainabilityTracker() {
  const { t } = useTranslation();
  const { activeStadium, activeStadiumName } = useContext(StadiumContext);
  const [attendancePercentage, setAttendancePercentage] = useState(88);
  const [reusableCupReturns, setReusableCupReturns] = useState(42000);
  const [refillStationUses, setRefillStationUses] = useState(18500);
  const [transitAdoptionPercentage, setTransitAdoptionPercentage] = useState(64);
  const [energyLoadPercentage, setEnergyLoadPercentage] = useState(72);

  const sustainabilityMetrics = useMemo(() => {
    const expectedAttendance = Math.round((activeStadium.capacity || 87157) * (attendancePercentage / 100));
    const divertedWasteKilograms = Math.round(reusableCupReturns * 0.028 + refillStationUses * 0.018);
    const avoidedPlasticBottles = Math.round(refillStationUses * 0.85);
    const lowCarbonTrips = Math.round(expectedAttendance * (transitAdoptionPercentage / 100));
    const estimatedCarbonReductionTons = Number(((lowCarbonTrips * 1.8) / 1000).toFixed(1));
    const energyRiskLabel = energyLoadPercentage >= 85 ? "High load" : energyLoadPercentage >= 70 ? "Managed load" : "Efficient load";

    return {
      expectedAttendance,
      divertedWasteKilograms,
      avoidedPlasticBottles,
      lowCarbonTrips,
      estimatedCarbonReductionTons,
      energyRiskLabel
    };
  }, [activeStadium.capacity, attendancePercentage, energyLoadPercentage, refillStationUses, reusableCupReturns, transitAdoptionPercentage]);

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("sustainabilityTracker.title")}
        description={`Track deterministic FIFA World Cup 2026 sustainability indicators for ${activeStadiumName}, including waste diversion, refill usage, energy load, and low-carbon travel.`}
      >
        <StadiumSelector id="sustainability-stadium-selector" label="Sustainability venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Sustainability Inputs" description="Adjust local operating assumptions for a transparent demo calculation.">
          <div className="space-y-5">
            <FormField label={`Attendance load: ${attendancePercentage}%`} htmlFor="attendance-percentage">
              <input
                id="attendance-percentage"
                aria-label="Attendance load percentage"
                type="range"
                min="40"
                max="100"
                value={attendancePercentage}
                className="w-full"
                onChange={(changeEvent) => setAttendancePercentage(Number(changeEvent.target.value))}
              />
            </FormField>
            <FormField label="Reusable cup returns" htmlFor="reusable-cup-returns">
              <input
                id="reusable-cup-returns"
                aria-label="Reusable cup returns"
                type="number"
                min="0"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={reusableCupReturns}
                onChange={(changeEvent) => setReusableCupReturns(Number(changeEvent.target.value))}
              />
            </FormField>
            <FormField label="Refill station uses" htmlFor="refill-station-uses">
              <input
                id="refill-station-uses"
                aria-label="Refill station uses"
                type="number"
                min="0"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={refillStationUses}
                onChange={(changeEvent) => setRefillStationUses(Number(changeEvent.target.value))}
              />
            </FormField>
            <FormField label={`Public transit adoption: ${transitAdoptionPercentage}%`} htmlFor="transit-adoption-percentage">
              <input
                id="transit-adoption-percentage"
                aria-label="Public transit adoption percentage"
                type="range"
                min="0"
                max="100"
                value={transitAdoptionPercentage}
                className="w-full"
                onChange={(changeEvent) => setTransitAdoptionPercentage(Number(changeEvent.target.value))}
              />
            </FormField>
            <FormField label={`Venue energy load: ${energyLoadPercentage}%`} htmlFor="energy-load-percentage">
              <input
                id="energy-load-percentage"
                aria-label="Venue energy load percentage"
                type="range"
                min="30"
                max="100"
                value={energyLoadPercentage}
                className="w-full"
                onChange={(changeEvent) => setEnergyLoadPercentage(Number(changeEvent.target.value))}
              />
            </FormField>
          </div>
        </Card>

        <Card title="Sustainability Dashboard" description="Transparent calculations for venue staff review; no external sustainability API is called.">
          <div className="mb-5">
            <StatusBadge
              label={sustainabilityMetrics.energyRiskLabel}
              tone={energyLoadPercentage >= 85 ? "danger" : energyLoadPercentage >= 70 ? "warning" : "success"}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Expected attendance" value={sustainabilityMetrics.expectedAttendance.toLocaleString()} helperText="Capacity multiplied by current attendance load." />
            <MetricCard label="Waste diverted" value={`${sustainabilityMetrics.divertedWasteKilograms.toLocaleString()} kg`} helperText="Reusable cups and refill usage converted to a venue estimate." />
            <MetricCard label="Plastic bottles avoided" value={sustainabilityMetrics.avoidedPlasticBottles.toLocaleString()} helperText="Estimated from refill station usage." />
            <MetricCard label="Low-carbon trips" value={sustainabilityMetrics.lowCarbonTrips.toLocaleString()} helperText="Fans expected to use public transit or shared modes." />
            <MetricCard label="Carbon reduction" value={`${sustainabilityMetrics.estimatedCarbonReductionTons} t`} helperText="Demo factor based on avoided private-car trips." />
            <MetricCard label="Energy load" value={`${energyLoadPercentage}%`} helperText="Monitor before lighting, screen, and HVAC peaks." />
          </div>
        </Card>
      </div>
    </section>
  );
}
