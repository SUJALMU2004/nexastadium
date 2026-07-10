import PropTypes from "prop-types";

const STATUS_TONE_CLASSES = {
  neutral: "border-stadium-primary/15 bg-stadium-primary/5 text-stadium-primary",
  success: "border-stadium-green/20 bg-stadium-green/10 text-stadium-green",
  warning: "border-stadium-accent/40 bg-stadium-accent/15 text-stadium-primary",
  danger: "border-stadium-danger/25 bg-stadium-danger/10 text-stadium-danger",
  critical: "border-stadium-danger bg-stadium-danger text-white"
};

/**
 * Render a visible text badge so status is not communicated by color alone.
 *
 * @param {{label: string, tone?: string}} props - Status label and tone key.
 * @returns {JSX.Element} Text status badge.
 */
export default function StatusBadge({ label, tone = "neutral" }) {
  const toneClassName = STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.neutral;

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${toneClassName}`}>
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["neutral", "success", "warning", "danger", "critical"])
};
