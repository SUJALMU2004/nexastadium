import PropTypes from "prop-types";

/**
 * Render a simple ordered timeline for match-day actions.
 *
 * @param {{items: Array<{title: string, description: string}>}} props - Timeline entries.
 * @returns {JSX.Element} Ordered timeline.
 */
export default function Timeline({ items }) {
  return (
    <ol className="space-y-4">
      {items.map((timelineItem, timelineIndex) => (
        <li key={`${timelineItem.title}-${timelineIndex}`} className="grid grid-cols-[2rem_1fr] gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stadium-primary text-sm font-bold text-white">
            {timelineIndex + 1}
          </span>
          <span>
            <span className="block text-sm font-bold text-stadium-primary">{timelineItem.title}</span>
            <span className="mt-1 block text-sm leading-6 text-stadium-primary/70">{timelineItem.description}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

Timeline.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired
    })
  ).isRequired
};
