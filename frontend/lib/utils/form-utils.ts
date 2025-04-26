/**
 * Utility functions for handling form data
 */

/**
 * Type guard to check if a value is a File
 * @param value - The value to check
 * @returns True if the value is a File
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Get a form entry by key
 * @param formData - The form data to search
 * @param key - The key to search for
 * @returns The form entry or null if not found
 */
export function getFormEntry(formData: FormData, key: string): FormDataEntryValue | null {
  return formData.get(key);
}

/**
 * Get a form entry as a string
 * @param formData - The form data to search
 * @param key - The key to search for
 * @param defaultValue - The default value to return if the entry is not found
 * @returns The form entry as a string
 */
export function getFormEntryAsString(formData: FormData, key: string, defaultValue = ''): string {
  const entry = formData.get(key);
  if (entry === null) {
    return defaultValue;
  }
  
  return String(entry);
}

/**
 * Get a form entry as a file
 * @param formData - The form data to search
 * @param key - The key to search for
 * @returns The form entry as a file or null if not found or not a file
 */
export function getFormEntryAsFile(formData: FormData, key: string): File | null {
  const entry = formData.get(key);
  if (entry === null || !(entry instanceof File)) {
    return null;
  }
  
  return entry;
}

/**
 * Get all form entries as an array
 * @param formData - The form data to convert
 * @returns An array of [key, value] pairs
 */
export function getFormEntries(formData: FormData): [string, FormDataEntryValue][] {
  return Array.from(formData.entries());
}

/**
 * Log form entries for debugging
 * @param formData - The form data to log
 */
export function logFormEntries(formData: FormData): void {
  const entries = getFormEntries(formData);
  console.log(`Form data entries count: ${entries.length}`);
  
  if (entries.length === 0) {
    console.log('Empty form data received');
    return;
  }
  
  entries.forEach(([key, value]) => {
    if (value instanceof File) {
      console.log(
        `Form entry: ${key} = File (${value.name}, ${value.size} bytes, ${value.type})`
      );
    } else {
      console.log(`Form entry: ${key} = ${value}`);
    }
  });
}
