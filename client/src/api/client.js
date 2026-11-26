// One function owns every request (session 20)
const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  let res;
  try {
    res = await fetch(API_URL + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  } catch {
    // No answer at all: no internet, or the free server is still waking up
    throw new Error('Cannot reach the server. It may be waking up, try again in a minute.');
  }
  // Token expired or invalid -> tell the app to log out
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
  }
  if (res.status === 204) return null;
  // Our API always answers JSON; a host error page (HTML) would not parse
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    throw new Error(body?.error ?? `The server had a problem (${res.status}). Try again in a minute.`);
  }
  return body;
}
