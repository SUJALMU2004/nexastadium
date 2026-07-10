import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

/**
 * Render the primary navigation shared across all open portals.
 *
 * @returns {JSX.Element} Accessible main navigation.
 */
export default function Navbar() {
  const { t } = useTranslation();

  const navLinkClassName = ({ isActive }) =>
    [
      "rounded-md px-3 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-stadium-accent text-stadium-primary"
        : "text-white hover:bg-white/10"
    ].join(" ");

  return (
    <nav role="navigation" aria-label={t("nav.mainNavigation")} className="bg-stadium-primary text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-stadium-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-stadium-primary"
      >
        {t("common.skipToMain")}
      </a>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <NavLink to="/fan" aria-label={t("nav.logoLabel")} className="flex items-center gap-3">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-stadium-accent" />
          <span className="text-lg font-bold tracking-normal">NexaStadium AI</span>
        </NavLink>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            <NavLink to="/fan" aria-label={t("nav.fan")} className={navLinkClassName}>
              {t("nav.fan")}
            </NavLink>
            <NavLink to="/ops" aria-label={t("nav.ops")} className={navLinkClassName}>
              {t("nav.ops")}
            </NavLink>
            <NavLink to="/transit" aria-label={t("nav.transit")} className={navLinkClassName}>
              {t("nav.transit")}
            </NavLink>
          </div>
          <LanguageSwitcher compact />
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {};
