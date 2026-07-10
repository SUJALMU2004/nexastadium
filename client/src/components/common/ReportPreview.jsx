import PropTypes from "prop-types";

/**
 * Render a copyable/downloadable Markdown operations report preview.
 *
 * @param {{title: string, markdown: string, onCopy: () => void, onDownload: () => void, copyLabel?: string}} props - Report controls and Markdown.
 * @returns {JSX.Element} Report preview.
 */
export default function ReportPreview({ title, markdown, onCopy, onDownload, copyLabel = "Copy Markdown" }) {
  return (
    <section className="rounded-lg border border-stadium-primary/10 bg-stadium-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-stadium-primary">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="Copy operations report Markdown"
            className="rounded-md border border-stadium-primary/20 px-3 py-2 text-sm font-semibold text-stadium-primary"
            onClick={onCopy}
          >
            {copyLabel}
          </button>
          <button
            type="button"
            aria-label="Download operations report Markdown"
            className="rounded-md bg-stadium-accent px-3 py-2 text-sm font-semibold text-stadium-primary"
            onClick={onDownload}
          >
            Download
          </button>
        </div>
      </div>
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-white p-4 text-sm leading-6 text-stadium-primary">
        {markdown}
      </pre>
    </section>
  );
}

ReportPreview.propTypes = {
  title: PropTypes.string.isRequired,
  markdown: PropTypes.string.isRequired,
  onCopy: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  copyLabel: PropTypes.string
};
