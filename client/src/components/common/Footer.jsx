import { useTranslation } from "react-i18next";

/**
 * Render shared footer context for the open Phase 3 platform.
 *
 * @returns {JSX.Element} Footer content.
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-stadium-primary/10 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-stadium-primary/75 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>{t("footer.phaseOne")}</p>
        <p>{t("footer.noAuth")}</p>
      </div>
    </footer>
  );
}

Footer.propTypes = {};
