/**
 * Mock implementation of warnImageDimensions
 * @param src - The image source
 */
export function warnImageDimensions(src: string): void {
  console.warn(`Image with src "${src}" has only one dimension specified. For optimal performance, specify both width and height.`);
}
