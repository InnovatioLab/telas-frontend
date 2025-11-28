export function isPdfFile(url?: string | null): boolean {
  if (!url) return false;
  try {
    return /\.pdf(\?|$|#)/i.test(url);
  } catch (err) {
    return false;
  }
}

export function isImageFile(url?: string | null): boolean {
  if (!url) return false;
  try {
    return /\.(jpg|jpeg|png|gif|svg|bmp|tiff|webp)(\?|$|#)/i.test(url);
  } catch (err) {
    return false;
  }
}

export function getFileExtension(url?: string | null): string | null {
  if (!url) return null;
  try {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$|#)/);
    return match ? match[1].toLowerCase() : null;
  } catch (err) {
    return null;
  }
}



