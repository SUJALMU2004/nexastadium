import PropTypes from "prop-types";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { SUPPORTED_LANGUAGES } from "../../utils/constants.js";

/**
 * Render a native select for changing the application language.
 *
 * @param {{compact?: boolean}} props - Optional layout variant flag.
 * @returns {JSX.Element} Accessible language selector.
 */
export default function LanguageSwitcher({ compact = false }) {
  const { t, i18n } = useTranslation();
  const { selectedLanguage, setSelectedLanguage } = useContext(StadiumContext);

  /**
   * Apply a selected language to i18n and stadium context.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} changeEvent - Select change event.
   * @returns {void}
   */
  function handleLanguageChange(changeEvent) {
    const nextLanguageCode = changeEvent.target.value;
    setSelectedLanguage(nextLanguageCode);
    i18n.changeLanguage(nextLanguageCode);
  }

  return (
    <label className={compact ? "block" : "flex items-center gap-2 text-sm font-medium"}>
      <span className="sr-only">{t("common.selectLanguage")}</span>
      <select
        aria-label={t("common.selectLanguage")}
        className="rounded-md border border-stadium-primary/20 bg-white px-3 py-2 text-sm text-stadium-primary shadow-sm"
        value={selectedLanguage}
        onChange={handleLanguageChange}
      >
        {SUPPORTED_LANGUAGES.map((languageOption) => (
          <option key={languageOption.code} value={languageOption.code}>
            {languageOption.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

LanguageSwitcher.propTypes = {
  compact: PropTypes.bool
};

