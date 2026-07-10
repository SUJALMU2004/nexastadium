import { useTranslation } from "react-i18next";

/**
 * Provide the current i18n language and a safe language setter.
 *
 * @returns {{currentLanguage: string, changeLanguage: Function}} Language state helpers.
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  /**
   * Change the active application language.
   *
   * @param {string} languageCode - Supported i18n language code.
   * @returns {Promise<unknown>} i18next language change promise.
   */
  function changeLanguage(languageCode) {
    return i18n.changeLanguage(languageCode);
  }

  return {
    currentLanguage: i18n.language,
    changeLanguage
  };
}

