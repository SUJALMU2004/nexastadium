import PropTypes from "prop-types";

/**
 * Render a user-facing error message without exposing internal exception details.
 *
 * @param {{message: string}} props - Human-readable error text.
 * @returns {JSX.Element|null} Error alert or null when no message is present.
 */
export default function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div role="alert" className="rounded-lg border border-stadium-danger/25 bg-stadium-danger/10 p-4 text-sm text-stadium-danger">
      <span className="font-semibold">Action needed: </span>
      {message}
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired
};
