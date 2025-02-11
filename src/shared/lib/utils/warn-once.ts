const warnedMessages = new Set<string>();

export function warnOnce(message: string) {
  if (!warnedMessages.has(message)) {
    console.warn(message);
    warnedMessages.add(message);
  }
}

export function warnImageDimensions(src: string) {
  warnOnce(`Image with src "${src}" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.`);
}
