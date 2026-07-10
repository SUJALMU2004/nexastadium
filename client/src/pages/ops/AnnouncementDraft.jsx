import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import FormField from "../../components/common/FormField.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ScenarioSelector from "../../components/common/ScenarioSelector.jsx";
import StadiumSelector from "../../components/common/StadiumSelector.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { StadiumContext } from "../../context/StadiumContext.jsx";
import { getPAAnnouncement } from "../../services/aiService.js";
import { ANNOUNCEMENT_PURPOSE_OPTIONS, ANNOUNCEMENT_TONE_OPTIONS, SUPPORTED_LANGUAGES } from "../../utils/constants.js";

/**
 * Render the multilingual PA announcement drafting workflow.
 *
 * @returns {JSX.Element} Announcement drafting page.
 */
export default function AnnouncementDraft() {
  const { t } = useTranslation();
  const { activeScenario, activeStadiumId, activeStadiumName } = useContext(StadiumContext);
  const [announcementPurpose, setAnnouncementPurpose] = useState(ANNOUNCEMENT_PURPOSE_OPTIONS[0]);
  const [announcementTone, setAnnouncementTone] = useState(ANNOUNCEMENT_TONE_OPTIONS[0]);
  const [selectedLanguageCodes, setSelectedLanguageCodes] = useState(["en", "es", "fr"]);
  const [announcementResponse, setAnnouncementResponse] = useState(null);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [copiedLanguageCode, setCopiedLanguageCode] = useState("");

  /**
   * Toggle one announcement language in the request payload.
   *
   * @param {string} languageCode - Supported language code.
   * @returns {void}
   */
  function handleLanguageToggle(languageCode) {
    setSelectedLanguageCodes((currentCodes) =>
      currentCodes.includes(languageCode)
        ? currentCodes.filter((currentCode) => currentCode !== languageCode)
        : [...currentCodes, languageCode]
    );
  }

  /**
   * Request deterministic announcement copy for selected languages.
   *
   * @param {React.FormEvent<HTMLFormElement>} submitEvent - Form submit event.
   * @returns {Promise<void>} Resolves after announcement copy is generated.
   */
  async function handleAnnouncementSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (selectedLanguageCodes.length === 0) {
      setAnnouncementError("Select at least one announcement language.");
      return;
    }

    setIsLoadingAnnouncement(true);
    setAnnouncementError("");
    setCopiedLanguageCode("");

    try {
      const generatedAnnouncementResponse = await getPAAnnouncement({
        scenario_id: activeScenario,
        language_codes: selectedLanguageCodes,
        stadium_id: activeStadiumId,
        announcement_purpose: announcementPurpose,
        tone: announcementTone
      });
      setAnnouncementResponse(generatedAnnouncementResponse.announcements);
    } catch (caughtError) {
      setAnnouncementError(caughtError.message || "The PA announcement could not be generated.");
    } finally {
      setIsLoadingAnnouncement(false);
    }
  }

  /**
   * Copy generated PA copy to the clipboard when browser support exists.
   *
   * @param {string} languageCode - Announcement language code.
   * @param {string} announcementText - Announcement copy to copy.
   * @returns {Promise<void>} Resolves after copy attempt.
   */
  async function handleCopyAnnouncement(languageCode, announcementText) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(announcementText);
      setCopiedLanguageCode(languageCode);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow={t("nav.ops")}
        title={t("announcementDraft.title")}
        description={`Draft calm FIFA World Cup 2026 public address copy for ${activeStadiumName}. The backend returns reviewed announcement copy for every requested language code.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StadiumSelector id="announcement-stadium-selector" label="Announcement venue" />
          <ScenarioSelector id="announcement-scenario-selector" label="Scenario context" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Announcement Controls" description="Set the operational purpose, tone, and language set for review.">
          <form className="space-y-4" onSubmit={handleAnnouncementSubmit}>
            <FormField label="Purpose" htmlFor="announcement-purpose">
              <select
                id="announcement-purpose"
                aria-label="Announcement purpose"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={announcementPurpose}
                onChange={(changeEvent) => setAnnouncementPurpose(changeEvent.target.value)}
              >
                {ANNOUNCEMENT_PURPOSE_OPTIONS.map((purposeOption) => (
                  <option key={purposeOption} value={purposeOption}>{purposeOption}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Tone" htmlFor="announcement-tone">
              <select
                id="announcement-tone"
                aria-label="Announcement tone"
                className="w-full rounded-md border border-stadium-primary/20 px-3 py-2 text-sm text-stadium-primary"
                value={announcementTone}
                onChange={(changeEvent) => setAnnouncementTone(changeEvent.target.value)}
              >
                {ANNOUNCEMENT_TONE_OPTIONS.map((toneOption) => (
                  <option key={toneOption} value={toneOption}>{toneOption}</option>
                ))}
              </select>
            </FormField>
            <fieldset className="rounded-lg border border-stadium-primary/10 p-4">
              <legend className="px-1 text-sm font-semibold text-stadium-primary">Announcement languages</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SUPPORTED_LANGUAGES.map((languageOption) => (
                  <label key={languageOption.code} className="flex items-center gap-2 text-sm text-stadium-primary">
                    <input
                      type="checkbox"
                      aria-label={`Include ${languageOption.nativeName} announcement`}
                      className="h-4 w-4 rounded border-stadium-primary/30 text-stadium-primary"
                      checked={selectedLanguageCodes.includes(languageOption.code)}
                      onChange={() => handleLanguageToggle(languageOption.code)}
                    />
                    {languageOption.nativeName}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              aria-label="Generate PA announcements"
              className="rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingAnnouncement}
            >
              Generate announcements
            </button>
          </form>
        </Card>

        <Card title="Draft Review" description="Every announcement should be reviewed by venue control before broadcast.">
          <ErrorMessage message={announcementError} />
          {isLoadingAnnouncement ? <LoadingSpinner message="Generating PA announcements" /> : null}
          {!isLoadingAnnouncement && !announcementResponse ? (
            <EmptyState title="No announcements generated yet" message="Submit announcement controls to generate scenario-aware PA drafts." />
          ) : null}
          {announcementResponse ? (
            <div className="space-y-4">
              <StatusBadge label="Safety review required before broadcast" tone="warning" />
              {Object.entries(announcementResponse).map(([languageCode, announcementText]) => (
                <article key={languageCode} className="rounded-lg border border-stadium-primary/10 bg-stadium-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold uppercase tracking-normal text-stadium-primary">{languageCode}</h2>
                    <button
                      type="button"
                      aria-label={`Copy ${languageCode} PA announcement`}
                      className="rounded-md border border-stadium-primary/20 px-3 py-2 text-sm font-semibold text-stadium-primary"
                      onClick={() => handleCopyAnnouncement(languageCode, announcementText)}
                    >
                      {copiedLanguageCode === languageCode ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stadium-primary">{announcementText}</p>
                </article>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
