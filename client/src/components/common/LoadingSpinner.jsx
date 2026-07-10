import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * Render an accessible loading indicator for async stadium workflows.
 *
 * @param {{message?: string}} props - Optional screen-reader loading message.
 * @returns {JSX.Element} Loading spinner with status role.
 */
export default function LoadingSpinner({ message = "" }) {
  const { t } = useTranslation();
  const loadingMessage = message || t("common.loading");

  return (
    <div role="status" aria-label={loadingMessage} className="inline-flex items-center gap-3 text-stadium-primary">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-stadium-primary border-t-stadium-accent" />
      <span className="sr-only">{loadingMessage}</span>
      <span className="text-sm font-medium">{loadingMessage}</span>
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string
};

