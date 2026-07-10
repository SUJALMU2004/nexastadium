import PropTypes from "prop-types";
import { useContext } from "react";
import { StadiumContext } from "../../context/StadiumContext.jsx";

/**
 * Render a shared stadium selector backed by StadiumContext.
 *
 * @param {{id?: string, label?: string}} props - Select identifier and visible label.
 * @returns {JSX.Element} Native stadium select.
 */
export default function StadiumSelector({ id = "active-stadium-selector", label = "Host stadium" }) {
  const { activeStadiumId, setActiveStadiumId, stadiumList } = useContext(StadiumContext);

  return (
    <label htmlFor={id} className="block text-sm font-semibold text-stadium-primary">
      {label}
      <select
        id={id}
        aria-label={label}
        className="mt-2 block w-full rounded-md border border-stadium-primary/20 bg-white px-3 py-2 text-sm text-stadium-primary shadow-sm"
        value={activeStadiumId}
        onChange={(changeEvent) => setActiveStadiumId(changeEvent.target.value)}
      >
        {stadiumList.map((stadiumRecord) => (
          <option key={stadiumRecord.id} value={stadiumRecord.id}>
            {stadiumRecord.name} - {stadiumRecord.city}
          </option>
        ))}
      </select>
    </label>
  );
}

StadiumSelector.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string
};
