import PropTypes from "prop-types";

/**
 * Render an ordered list of operational actions or route steps.
 *
 * @param {{items: string[], title?: string}} props - List title and items.
 * @returns {JSX.Element} Ordered action list.
 */
export default function ActionList({ items, title = "" }) {
  return (
    <div>
      {title ? <h3 className="text-sm font-bold uppercase tracking-normal text-stadium-primary/70">{title}</h3> : null}
      <ol className="mt-3 space-y-3">
        {items.map((actionItem, actionIndex) => (
          <li key={`${actionItem}-${actionIndex}`} className="flex gap-3 text-sm leading-6 text-stadium-primary">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stadium-primary text-xs font-bold text-white">
              {actionIndex + 1}
            </span>
            <span>{actionItem}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

ActionList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string
};
