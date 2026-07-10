import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";

/**
 * Render accessibility services and support data for the selected stadium.
 *
 * @returns {JSX.Element} Accessibility guide page.
 */
export default function AccessibilityGuide() {
  const { t } = useTranslation();
  const { activeStadium, activeStadiumName } = useContext(StadiumContext);
  const accessibilityFeatures = activeStadium.accessibility_features || {};
  const wheelchairAccessPoints = accessibilityFeatures.wheelchair_access_points || [];
  const hearingLoopSections = accessibilityFeatures.hearing_loop_sections || [];
  const accessibleRestrooms = accessibilityFeatures.accessible_restroom_locations || [];

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.fan")}
        title={t("accessibilityGuide.title")}
        description={`Review mobility, hearing, visual assistance, and restroom support points for ${activeStadiumName} before moving through FIFA World Cup 2026 crowds.`}
      >
        <StadiumSelector id="accessibility-stadium-selector" label="Accessibility venue" />
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Wheelchair Access Points" description="Primary accessible entries and service locations from the local venue dataset.">
          <ul className="space-y-2 text-sm leading-6 text-stadium-primary">
            {wheelchairAccessPoints.map((accessPoint) => (
              <li key={accessPoint} className="rounded-md bg-stadium-surface px-3 py-2">{accessPoint}</li>
            ))}
          </ul>
        </Card>

        <Card title="Hearing & Visual Assistance" description="Support services that should be confirmed with venue staff during live operations.">
          <div className="space-y-4">
            <div>
              <StatusBadge
                label={accessibilityFeatures.visual_assistance_available ? "Visual assistance available" : "Visual assistance not listed"}
                tone={accessibilityFeatures.visual_assistance_available ? "success" : "warning"}
              />
            </div>
            <ul className="space-y-2 text-sm leading-6 text-stadium-primary">
              {hearingLoopSections.map((hearingLoopSection) => (
                <li key={hearingLoopSection} className="rounded-md bg-stadium-surface px-3 py-2">{hearingLoopSection}</li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Accessible Restrooms" description="Restroom locations to prioritize for low-friction stadium movement.">
          <ul className="space-y-2 text-sm leading-6 text-stadium-primary">
            {accessibleRestrooms.map((restroomLocation) => (
              <li key={restroomLocation} className="rounded-md bg-stadium-surface px-3 py-2">{restroomLocation}</li>
            ))}
          </ul>
        </Card>

        <Card title="Need Live Guidance?" description="Ask the assistant for a low-crowd or mobility-aware route before leaving your current location.">
          <NavLink
            to="/fan/assistant"
            aria-label="Ask the Stadium AI Assistant about accessibility support"
            className="inline-flex rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary"
          >
            Ask Stadium AI Assistant
          </NavLink>
        </Card>
      </div>
    </section>
  );
}
