import PropTypes from "prop-types";

/**
 * Render an accessible table comparing two operations scenarios.
 *
 * @param {{items: Array<{scenario_id: string, scenario_name: string, crowd_density_percentage: number, affected_zones: string[], recommended_focus: string}>}} props - Scenario comparison rows.
 * @returns {JSX.Element} Comparison table.
 */
export default function ComparisonTable({ items }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stadium-primary/10">
      <table className="min-w-full divide-y divide-stadium-primary/10 bg-white text-sm">
        <caption className="sr-only">Operational scenario comparison</caption>
        <thead className="bg-stadium-primary text-white">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Scenario</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Density</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Affected zones</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Recommended focus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stadium-primary/10">
          {items.map((comparisonItem) => (
            <tr key={comparisonItem.scenario_id}>
              <th scope="row" className="px-4 py-3 text-left font-bold text-stadium-primary">{comparisonItem.scenario_name}</th>
              <td className="px-4 py-3 text-stadium-primary">{comparisonItem.crowd_density_percentage}%</td>
              <td className="px-4 py-3 text-stadium-primary/75">{comparisonItem.affected_zones.join(", ")}</td>
              <td className="px-4 py-3 text-stadium-primary/75">{comparisonItem.recommended_focus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ComparisonTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      scenario_id: PropTypes.string.isRequired,
      scenario_name: PropTypes.string.isRequired,
      crowd_density_percentage: PropTypes.number.isRequired,
      affected_zones: PropTypes.arrayOf(PropTypes.string).isRequired,
      recommended_focus: PropTypes.string.isRequired
    })
  ).isRequired
};
