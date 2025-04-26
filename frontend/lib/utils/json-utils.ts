/**
 * Utility functions for handling JSON operations
 */

/**
 * Safely parse JSON string, handling null values
 * @param jsonString - The JSON string to parse
 * @param defaultValue - The default value to return if parsing fails
 * @returns The parsed JSON object or the default value
 */
export function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (jsonString === null) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Safely stringify a value to JSON
 * @param value - The value to stringify
 * @param defaultValue - The default value to return if stringification fails
 * @returns The JSON string or the default value
 */
export function safeJsonStringify(value: any, defaultValue = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Error stringifying to JSON:', error);
    return defaultValue;
  }
}
