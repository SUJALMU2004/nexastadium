import PropTypes from "prop-types";

/**
 * Render a calm empty state for workflows that need user input first.
 *
 * @param {{title: string, message: string, children?: React.ReactNode}} props - Empty state copy and optional action.
 * @returns {JSX.Element} Empty state region.
 */
export default function EmptyState({ title, message, children = null }) {
  return (
    <div className="rounded-lg border border-dashed border-stadium-primary/25 bg-stadium-surface p-6 text-center">
      <p className="text-base font-semibold text-stadium-primary">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stadium-primary/70">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  children: PropTypes.node
};
