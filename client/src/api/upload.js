// Photo upload to our own API (POST /api/photos), which keeps the photo in MongoDB
const API_URL = import.meta.env.VITE_API_URL;
const MAX_SIZE = 1200; // px, the longest side

// A phone photo is often 3 to 5 MB: we draw it smaller on a canvas and send a JPEG instead
// (session 22, lighter images). The server refuses anything over 2 MB.
async function shrink(file) {
  let image;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error('This file is not a photo we can read. Try a JPEG or PNG.');
  }
  const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
}

// Sends the file, returns the URL of the photo
export async function uploadPhoto(file) {
  const photo = await shrink(file);
  const res = await fetch(`${API_URL}/api/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: photo, // the image itself, not JSON
  });
  if (res.status === 401) window.dispatchEvent(new Event('auth:expired'));
  if (!res.ok) throw new Error((await res.json()).error ?? 'Photo upload failed');
  return (await res.json()).url;
}

// Session 22, images: the right size for each place on the page.
// Demo photos come from Wikimedia Commons, where the width is in the URL (?width=800).
// Our own photos were already made 1200 px wide when they were sent.
export function sizedPhoto(url, width) {
  if (url.includes('wikimedia.org')) return url.replace(/width=\d+/, `width=${width}`);
  return url;
}
