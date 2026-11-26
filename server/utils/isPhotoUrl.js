// A photo link must be an http(s) address, or empty (no photo).
// Stops "javascript:..." or random text from being saved as a photo.
export function isPhotoUrl(value) {
  return value === '' || /^https?:\/\/\S+$/i.test(value);
}

export const photoUrlRule = { validator: isPhotoUrl, message: 'A photo must be an http(s) link' };
