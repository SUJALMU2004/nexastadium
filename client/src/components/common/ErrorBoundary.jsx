import PropTypes from "prop-types";
import React from "react";

/**
 * Catch unexpected React rendering failures and show a branded recovery path.
 */
export default class ErrorBoundary extends React.Component {
  /**
   * Initialize error boundary state.
   *
   * @param {{children: React.ReactNode}} props - Child tree wrapped by the boundary.
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when a descendant throws during render.
   *
   * @returns {{hasError: boolean}} Updated error boundary state.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Log development-only diagnostics after a rendering failure.
   *
   * @param {Error} error - Thrown rendering error.
   * @param {React.ErrorInfo} errorInfo - React component stack metadata.
   * @returns {void}
   */
  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("NexaStadium AI render failure", error, errorInfo);
    }
  }

  /**
   * Render either children or the keyboard-accessible fallback state.
   *
   * @returns {React.ReactNode} Protected child tree or fallback UI.
   */
  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-stadium-surface px-4">
          <section className="max-w-xl rounded-lg border border-stadium-danger/20 bg-white p-6 shadow-stadium">
            <p className="text-sm font-semibold uppercase tracking-normal text-stadium-danger">
              FIFA World Cup 2026 operations notice
            </p>
            <h1 className="mt-3 text-2xl font-bold text-stadium-primary">NexaStadium AI needs to reload this view</h1>
            <p className="mt-3 text-stadium-primary/75">
              The platform could not render this stadium workflow. Return to the fan portal and continue with public match day support.
            </p>
            <a
              href="/"
              aria-label="Return to fan home"
              className="mt-5 inline-flex rounded-md bg-stadium-accent px-4 py-2 font-semibold text-stadium-primary"
            >
              Return to fan home
            </a>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};
