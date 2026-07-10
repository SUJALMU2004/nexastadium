import PropTypes from "prop-types";

/**
 * Render a labeled form field with optional help and validation copy.
 *
 * @param {{label: string, htmlFor: string, helpText?: string, error?: string, children: React.ReactNode}} props - Field metadata and control.
 * @returns {JSX.Element} Accessible form field wrapper.
 */
export default function FormField({ label, htmlFor, helpText = "", error = "", children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-stadium-primary">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {helpText ? <p className="mt-2 text-xs leading-5 text-stadium-primary/65">{helpText}</p> : null}
      {error ? <p className="mt-2 text-sm font-semibold text-stadium-danger">{error}</p> : null}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string.isRequired,
  helpText: PropTypes.string,
  error: PropTypes.string,
  children: PropTypes.node.isRequired
};
