import PropTypes from "prop-types";

/**
 * Render a compact metric with visible label, value, and supporting context.
 *
 * @param {{label: string, value: string|number, helperText?: string}} props - Metric copy.
 * @returns {JSX.Element} Metric card.
 */
export default function MetricCard({ label, value, helperText = "" }) {
  return (
    <div className="rounded-lg border border-stadium-primary/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stadium-primary/70">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stadium-primary">{value}</p>
      {helperText ? <p className="mt-2 text-xs leading-5 text-stadium-primary/65">{helperText}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helperText: PropTypes.string
};
