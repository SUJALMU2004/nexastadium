import PropTypes from "prop-types";
import { useContext } from "react";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { SCENARIO_TYPES } from "../../utils/constants.js";

/**
 * Render a shared operations scenario selector backed by StadiumContext.
 *
 * @param {{id?: string, label?: string}} props - Select identifier and visible label.
 * @returns {JSX.Element} Native scenario select.
 */
export default function ScenarioSelector({ id = "active-scenario-selector", label = "Operational scenario" }) {
  const { activeScenario, setActiveScenario, scenarioList } = useContext(StadiumContext);
  const selectableScenarios = scenarioList.length
    ? scenarioList
    : SCENARIO_TYPES.map((scenarioId) => ({ id: scenarioId, name: scenarioId.replaceAll("_", " ") }));

  return (
    <label htmlFor={id} className="block text-sm font-semibold text-stadium-primary">
      {label}
      <select
        id={id}
        aria-label={label}
        className="mt-2 block w-full rounded-md border border-stadium-primary/20 bg-white px-3 py-2 text-sm text-stadium-primary shadow-sm"
        value={activeScenario}
        onChange={(changeEvent) => setActiveScenario(changeEvent.target.value)}
      >
        {selectableScenarios.map((scenarioRecord) => (
          <option key={scenarioRecord.id} value={scenarioRecord.id}>
            {scenarioRecord.name}
          </option>
        ))}
      </select>
    </label>
  );
}

ScenarioSelector.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string
};
