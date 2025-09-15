import { Transform } from 'class-transformer';

/**
 * Utility function to transform string boolean values from query parameters
 * Handles: "true", "false", "1", "0", actual booleans, undefined, null, empty strings
 */
export function BooleanTransform() {
  return Transform(({ value }) => {
    // If already undefined, null, or empty string, return undefined (no filter)
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    // If already a boolean, return as is
    if (typeof value === 'boolean') {
      return value;
    }

    // Handle string values
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'true' || lowerValue === '1') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === '0') {
        return false;
      }
    }

    // If we can't determine the boolean value, return undefined
    return undefined;
  });
}
