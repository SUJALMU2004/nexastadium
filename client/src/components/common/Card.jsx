import PropTypes from "prop-types";

/**
 * Render a bounded content card for a single tool, result, or repeated item.
 *
 * @param {{title?: string, description?: string, children: React.ReactNode, footer?: React.ReactNode}} props - Card content.
 * @returns {JSX.Element} Styled card container.
 */
export default function Card({ title = "", description = "", children, footer = null }) {
  return (
    <section className="rounded-lg border border-stadium-primary/10 bg-white p-5 shadow-sm">
      {title || description ? (
        <div className="mb-4">
          {title ? <h2 className="text-lg font-bold text-stadium-primary">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm leading-6 text-stadium-primary/70">{description}</p> : null}
        </div>
      ) : null}
      {children}
      {footer ? <div className="mt-4 border-t border-stadium-primary/10 pt-4">{footer}</div> : null}
    </section>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node
};
