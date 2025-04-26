/**
 * Utility to warn about image dimensions
 */

const warnings = new Set<string>();

/**
 * Warns about image dimensions once per message
 * @param message - Warning message
 */
export function warnImageDimensions(message: string): void {
  if (warnings.has(message)) {
    return;
  }
  
  console.warn(message);
  warnings.add(message);
}
