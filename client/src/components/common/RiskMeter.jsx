import PropTypes from "prop-types";
import { RISK_TONE_BY_LEVEL } from "../../utils/constants.js";
import StatusBadge from "./StatusBadge.jsx";

const RISK_BAR_CLASSES = {
  success: "bg-stadium-green",
  warning: "bg-stadium-accent",
  danger: "bg-stadium-danger",
  critical: "bg-stadium-danger"
};

/**
 * Map numeric risk into stable Tailwind width classes.
 *
 * @param {number} normalizedScore - Risk score from 0 to 100.
 * @returns {string} Width class for the visual meter bar.
 */
function getRiskWidthClass(normalizedScore) {
  if (normalizedScore >= 88) {
    return "w-full";
  }
  if (normalizedScore >= 63) {
    return "w-3/4";
  }
  if (normalizedScore >= 38) {
    return "w-1/2";
  }
  if (normalizedScore > 0) {
    return "w-1/4";
  }
  return "w-0";
}

/**
 * Render a text-labeled risk meter so color is not the only signal.
 *
 * @param {{score: number, level: string, label?: string}} props - Risk score, level, and visible label.
 * @returns {JSX.Element} Accessible risk meter.
 */
export default function RiskMeter({ score, level, label = "Crowd risk" }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const normalizedLevel = String(level || "medium").toLowerCase();
  const badgeTone = RISK_TONE_BY_LEVEL[normalizedLevel] || "warning";
  const barClassName = RISK_BAR_CLASSES[badgeTone] || RISK_BAR_CLASSES.warning;
  const widthClassName = getRiskWidthClass(normalizedScore);

  return (
    <div className="rounded-lg border border-stadium-primary/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stadium-primary">{label}</p>
        <StatusBadge label={`${normalizedLevel} risk`} tone={badgeTone} />
      </div>
      <div
        className="mt-4 h-3 rounded-full bg-stadium-primary/10"
        role="meter"
        aria-label={`${label}: ${normalizedScore} out of 100, ${normalizedLevel} risk`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={normalizedScore}
      >
        <div className={`h-3 rounded-full ${barClassName} ${widthClassName}`} />
      </div>
      <p className="mt-2 text-sm font-semibold text-stadium-primary">{normalizedScore}/100</p>
    </div>
  );
}

RiskMeter.propTypes = {
  score: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
  label: PropTypes.string
};
