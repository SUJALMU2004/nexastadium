import PropTypes from "prop-types";
import { SUPPORTED_LANGUAGES } from "../../utils/constants.js";

/**
 * Render keyboard-accessible language tabs with native button controls.
 *
 * @param {{languageCodes: string[], activeLanguageCode: string, onLanguageChange: (languageCode: string) => void}} props - Tab state and handler.
 * @returns {JSX.Element} Language tab list.
 */
export default function LanguageTabs({ languageCodes, activeLanguageCode, onLanguageChange }) {
  const languageLabels = Object.fromEntries(SUPPORTED_LANGUAGES.map((languageOption) => [languageOption.code, languageOption.nativeName]));

  return (
    <div role="tablist" aria-label="Safety pack languages" className="flex flex-wrap gap-2">
      {languageCodes.map((languageCode) => (
        <button
          key={languageCode}
          type="button"
          role="tab"
          aria-selected={activeLanguageCode === languageCode}
          aria-label={`Show ${languageLabels[languageCode] || languageCode} safety pack`}
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            activeLanguageCode === languageCode
              ? "border-stadium-accent bg-stadium-accent text-stadium-primary"
              : "border-stadium-primary/20 bg-white text-stadium-primary"
          }`}
          onClick={() => onLanguageChange(languageCode)}
        >
          {languageLabels[languageCode] || languageCode}
        </button>
      ))}
    </div>
  );
}

LanguageTabs.propTypes = {
  languageCodes: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeLanguageCode: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired
};
