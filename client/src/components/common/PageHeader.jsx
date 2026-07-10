import PropTypes from "prop-types";

/**
 * Render the single page heading and FIFA World Cup 2026 workflow summary.
 *
 * @param {{eyebrow?: string, title: string, description: string, children?: React.ReactNode}} props - Header copy and optional controls.
 * @returns {JSX.Element} Accessible page header.
 */
export default function PageHeader({ eyebrow = "", title, description, children = null }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-stadium-primary/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-normal text-stadium-green">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-stadium-primary md:text-4xl">{title}</h1>
        <p className="mt-3 text-base leading-7 text-stadium-primary/75">{description}</p>
      </div>
      {children ? <div className="w-full lg:w-auto">{children}</div> : null}
    </header>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node
};
