import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionList from "../../components/common/ActionList.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LanguageTabs from "../../components/common/LanguageTabs.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { generateSafetySupportPack } from "../../services/aiService.js";
import { ACCESSIBILITY_NEED_OPTIONS, SAFETY_SUPPORT_FOCUS_OPTIONS, SUPPORTED_LANGUAGES } from "../../utils/constants.js";

/**
 * Render multilingual fan safety support pack workflow.
 *
 * @returns {JSX.Element} Safety guide page.
 */
export default function SafetyGuide() {
  const { t } = useTranslation();
  const { activeStadiumId, activeStadiumName, selectedLanguage } = useContext(StadiumContext);
  const [supportFocus, setSupportFocus] = useState(SAFETY_SUPPORT_FOCUS_OPTIONS[0]);
  const [currentLocation, setCurrentLocation] = useState("Main concourse");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(ACCESSIBILITY_NEED_OPTIONS[0]);
  const [safetyNotes, setSafetyNotes] = useState("");
  const [selectedLanguageCodes, setSelectedLanguageCodes] = useState(["en", selectedLanguage]);
  const [activeLanguageCode, setActiveLanguageCode] = useState("en");
  const [safetyPackResponse, setSafetyPackResponse] = useState(null);
  const [isLoadingSafetyPack, setIsLoadingSafetyPack] = useState(false);
  const [safetyPackError, setSafetyPackError] = useState("");

  useEffect(() => {
    setSelectedLanguageCodes((currentLanguageCodes) => Array.from(new Set([...currentLanguageCodes, selectedLanguage])));
  }, [selectedLanguage]);

  /**
   * Toggle one language in the safety support request.
   *
   * @param {string} languageCode - Supported language code.
   * @returns {void}
   */
  function handleLanguageToggle(languageCode) {
    setSelectedLanguageCodes((currentLanguageCodes) =>
      currentLanguageCodes.includes(languageCode)
        ? currentLanguageCodes.filter((currentCode) => currentCode !== languageCode)
        : [...currentLanguageCodes, languageCode]
    );
  }

  /**
   * Submit safety support context to the backend.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after safety pack state updates.
   */
  async function handleSafetyPackSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (selectedLanguageCodes.length === 0) {
      setSafetyPackError("Select at least one safety support language.");
      return;
    }

    setIsLoadingSafetyPack(true);
    setSafetyPackError("");

    try {
      const generatedSafetyPack = await generateSafetySupportPack({
        stadium_id: activeStadiumId,
        language_codes: selectedLanguageCodes,
        support_focus: supportFocus,
        current_location: currentLocation,
        accessibility_needs: accessibilityNeeds,
        notes: safetyNotes
      });
      setSafetyPackResponse(generatedSafetyPack.packs);
      setActiveLanguageCode(selectedLanguageCodes[0]);
    } catch (caughtError) {
      setSafetyPackError(caughtError.message || "The safety support pack could not be generated.");
    } finally {
      setIsLoadingSafetyPack(false);
    }
  }

  const generatedLanguageCodes = safetyPackResponse ? Object.keys(safetyPackResponse) : [];
  const activeSafetyPack = safetyPackResponse?.[activeLanguageCode] || null;

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.fan")}
        title={t("safetyGuide.title")}
        description={`Generate a multilingual FIFA World Cup 2026 safety support pack for fans at ${activeStadiumName}.`}
      >
        <StadiumSelector id="safety-guide-stadium-selector" label="Safety venue" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Safety Pack Inputs" description="The pack uses local safety templates, accessibility context, and sanitized fan notes.">
          <form className="space-y-4" onSubmit={handleSafetyPackSubmit}>
            <FormField label="Safety focus" htmlFor="safety-focus">
              <select
                id="safety-focus"
                aria-label="Safety focus"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={supportFocus}
                onChange={(changeEvent) => setSupportFocus(changeEvent.target.value)}
              >
                {SAFETY_SUPPORT_FOCUS_OPTIONS.map((focusOption) => (
                  <option key={focusOption} value={focusOption}>{focusOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Current location" htmlFor="safety-current-location">
              <input
                id="safety-current-location"
                aria-label="Current location"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={currentLocation}
                onChange={(changeEvent) => setCurrentLocation(changeEvent.target.value)}
              />
            </FormField>
            <FormField label="Accessibility need" htmlFor="safety-accessibility-need">
              <select
                id="safety-accessibility-need"
                aria-label="Accessibility need"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={accessibilityNeeds}
                onChange={(changeEvent) => setAccessibilityNeeds(changeEvent.target.value)}
              >
                {ACCESSIBILITY_NEED_OPTIONS.map((needOption) => (
                  <option key={needOption} value={needOption}>{needOption}</option>
                ))}
              </select>
            </FormField>
            <fieldset className="rounded-lg border border-stadium-primary/10 p-4">
              <legend className="px-1 text-sm font-semibold text-stadium-primary">Safety pack languages</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SUPPORTED_LANGUAGES.map((languageOption) => (
                  <label key={languageOption.code} className="flex items-center gap-2 text-sm text-stadium-primary">
                    <input
                      type="checkbox"
                      aria-label={`Include ${languageOption.nativeName} safety pack`}
                      className="h-4 w-4 rounded border-stadium-primary/30 text-stadium-primary"
                      checked={selectedLanguageCodes.includes(languageOption.code)}
                      onChange={() => handleLanguageToggle(languageOption.code)}
                    />
                    {languageOption.nativeName}
                  </label>
                ))}
              </div>
            </fieldset>
            <FormField label="Optional notes" htmlFor="safety-notes" helpText={`${safetyNotes.length}/1000 characters. Do not enter personal data.`}>
              <textarea
                id="safety-notes"
                aria-label="Optional safety notes"
                className="min-h-24 w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                maxLength={1000}
                value={safetyNotes}
                onChange={(changeEvent) => setSafetyNotes(changeEvent.target.value)}
              />
            </FormField>
            <button
              type="submit"
              aria-label="Generate safety support pack"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingSafetyPack}
            >
              Generate safety pack
            </button>
          </form>
        </Card>

        <Card title="Safety Support Pack" description="Fan-facing guidance is grouped by requested language.">
          <div aria-live="polite" className="space-y-5">
            <ErrorMessage message={safetyPackError} />
            {isLoadingSafetyPack ? <LoadingSpinner message="Generating safety support pack" /> : null}
            {!isLoadingSafetyPack && !safetyPackResponse ? (
              <EmptyState title="No safety pack generated yet" message="Submit the safety context to create multilingual support guidance." />
            ) : null}
            {safetyPackResponse ? (
              <>
                <LanguageTabs languageCodes={generatedLanguageCodes} activeLanguageCode={activeLanguageCode} onLanguageChange={setActiveLanguageCode} />
                {activeSafetyPack ? (
                  <article className="space-y-4 rounded-lg border border-stadium-primary/10 bg-stadium-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-stadium-primary">{activeSafetyPack.title}</h2>
                      <StatusBadge label="Fan safety guidance" tone="success" />
                    </div>
                    <ActionList title="Safety steps" items={activeSafetyPack.safety_steps} />
                    <p className="rounded-lg bg-white p-4 text-sm leading-6 text-stadium-primary">
                      <span className="font-semibold">Accessibility:</span> {activeSafetyPack.accessibility_note}
                    </p>
                    <p className="rounded-lg bg-white p-4 text-sm leading-6 text-stadium-primary">
                      <span className="font-semibold">Transport:</span> {activeSafetyPack.transport_note}
                    </p>
                    <p className="rounded-lg bg-stadium-green/10 p-4 text-sm leading-6 text-stadium-primary">
                      {activeSafetyPack.staff_help_message}
                    </p>
                  </article>
                ) : null}
              </>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
