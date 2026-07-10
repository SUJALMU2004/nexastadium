/**
 * Format a stadium capacity value for fan-facing display.
 *
 * @param {number} stadiumCapacity - Raw stadium capacity.
 * @returns {string} Locale-formatted capacity string.
 */
export function formatStadiumCapacity(stadiumCapacity) {
  return new Intl.NumberFormat().format(stadiumCapacity);
}

/**
 * Convert an unknown caught error into a user-friendly message.
 *
 * @param {unknown} caughtError - Error thrown by API or UI logic.
 * @returns {string} Safe message for the component layer.
 */
export function buildUserFacingErrorMessage(caughtError) {
  if (caughtError instanceof Error && caughtError.message) {
    return caughtError.message;
  }

  return "Something went wrong. Please try again.";
}

