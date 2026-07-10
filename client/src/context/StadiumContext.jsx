import PropTypes from "prop-types";
import { createContext, useEffect, useMemo, useState } from "react";
import { fetchScenarioList, fetchStadiumList } from "../services/stadiumService.js";
import { DEFAULT_STADIUM } from "../utils/constants.js";

export const StadiumContext = createContext({
  activeStadium: DEFAULT_STADIUM,
  activeStadiumId: DEFAULT_STADIUM.id,
  setActiveStadiumId: () => {},
  setActiveStadium: () => {},
  activeScenario: "MATCH_ENTRY_SURGE",
  setActiveScenario: () => {},
  activeScenarioDetails: null,
  selectedLanguage: "en",
  setSelectedLanguage: () => {},
  stadiumList: [DEFAULT_STADIUM],
  scenarioList: [],
  isLoadingStadiums: false,
  stadiumError: null,
  activeStadiumName: DEFAULT_STADIUM.name,
  activeStadiumCity: DEFAULT_STADIUM.city,
  activeStadiumCountry: DEFAULT_STADIUM.country
});

/**
 * Provide active stadium, scenario, language, and cached dataset state.
 *
 * @param {{children: React.ReactNode}} props - Provider children.
 * @returns {JSX.Element} Stadium context provider.
 */
export function StadiumProvider({ children }) {
  const [activeStadiumId, setActiveStadiumId] = useState(DEFAULT_STADIUM.id);
  const [activeScenario, setActiveScenario] = useState("MATCH_ENTRY_SURGE");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [stadiumList, setStadiumList] = useState([DEFAULT_STADIUM]);
  const [scenarioList, setScenarioList] = useState([]);
  const [isLoadingStadiums, setIsLoadingStadiums] = useState(false);
  const [stadiumError, setStadiumError] = useState(null);

  useEffect(() => {
    let shouldUpdateState = true;

    /**
     * Load stadium and scenario records once for shared Phase 3 controls.
     *
     * @returns {Promise<void>} Resolves after cached context data has been refreshed.
     */
    async function loadStadiumOperationsContext() {
      setIsLoadingStadiums(true);
      setStadiumError(null);

      try {
        const [stadiumListResponse, scenarioListResponse] = await Promise.all([
          fetchStadiumList(),
          fetchScenarioList()
        ]);

        if (!shouldUpdateState) {
          return;
        }

        const fetchedStadiums = Array.isArray(stadiumListResponse.stadiums)
          ? stadiumListResponse.stadiums
          : [DEFAULT_STADIUM];
        const fetchedScenarios = Array.isArray(scenarioListResponse.scenarios)
          ? scenarioListResponse.scenarios
          : [];

        setStadiumList(fetchedStadiums);
        setScenarioList(fetchedScenarios);
        setActiveStadiumId(fetchedStadiums[0]?.id || DEFAULT_STADIUM.id);
      } catch {
        if (shouldUpdateState) {
          setStadiumList([DEFAULT_STADIUM]);
          setScenarioList([]);
          setActiveStadiumId(DEFAULT_STADIUM.id);
          setStadiumError("Local stadium operations data could not be loaded. Using the default World Cup venue.");
        }
      } finally {
        if (shouldUpdateState) {
          setIsLoadingStadiums(false);
        }
      }
    }

    loadStadiumOperationsContext();

    return () => {
      shouldUpdateState = false;
    };
  }, []);

  const activeStadium = useMemo(
    () => stadiumList.find((stadiumRecord) => stadiumRecord.id === activeStadiumId) || DEFAULT_STADIUM,
    [activeStadiumId, stadiumList]
  );

  const activeScenarioDetails = useMemo(
    () => scenarioList.find((scenarioRecord) => scenarioRecord.id === activeScenario) || null,
    [activeScenario, scenarioList]
  );

  /**
   * Preserve the legacy setter shape while storing only the stadium ID.
   *
   * @param {{id?: string}} nextActiveStadium - Stadium object selected by legacy callers.
   * @returns {void}
   */
  function setActiveStadium(nextActiveStadium) {
    if (nextActiveStadium?.id) {
      setActiveStadiumId(nextActiveStadium.id);
    }
  }

  const stadiumContextValue = useMemo(
    () => ({
      activeStadium,
      activeStadiumId,
      setActiveStadiumId,
      setActiveStadium,
      activeScenario,
      setActiveScenario,
      activeScenarioDetails,
      selectedLanguage,
      setSelectedLanguage,
      stadiumList,
      scenarioList,
      isLoadingStadiums,
      stadiumError,
      activeStadiumName: activeStadium.name,
      activeStadiumCity: activeStadium.city,
      activeStadiumCountry: activeStadium.country
    }),
    [
      activeScenario,
      activeScenarioDetails,
      activeStadium,
      activeStadiumId,
      isLoadingStadiums,
      scenarioList,
      selectedLanguage,
      stadiumError,
      stadiumList
    ]
  );

  return <StadiumContext.Provider value={stadiumContextValue}>{children}</StadiumContext.Provider>;
}

StadiumProvider.propTypes = {
  children: PropTypes.node.isRequired
};
