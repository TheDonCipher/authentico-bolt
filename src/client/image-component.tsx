import { warnImageDimensions } from '../../shared/lib/utils/warn-once';

// ...existing code...

function handleLoading(event: any) {
  const img = event.target;
  if (img.width && !img.height) {
    img.style.height = 'auto';
    warnImageDimensions(img.src);
  } else if (img.height && !img.width) {
    img.style.width = 'auto';
    warnImageDimensions(img.src);
  }
  // ...existing code...
}

// ...existing code...
