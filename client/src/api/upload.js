// Photo upload straight from the browser to Cloudinary (third-party API)
// Uses an "unsigned upload preset": no secret key is needed in the browser
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// The photo field only shows up when Cloudinary is configured in .env
export const photosEnabled = Boolean(CLOUD && PRESET);

// Sends the file, returns the public URL of the photo
export async function uploadPhoto(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Photo upload failed');
  return (await res.json()).secure_url;
}

// Session 22, images: right size, right format. Cloudinary resizes the photo
// when the size is written in the URL, e.g. .../upload/w_800,f_auto,q_auto/...
// f_auto sends WebP to browsers that support it, q_auto picks a lighter quality.
export function sizedPhoto(url, width) {
  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
}
