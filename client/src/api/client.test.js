import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiFetch } from './client.js';

// fetch is replaced by a fake one, so no server is needed
afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('returns the JSON of a good answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [{ name: 'Cafe' }] }));
    expect(await apiFetch('/api/places')).toEqual([{ name: 'Cafe' }]);
  });

  it('shows the error message sent by our API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'Invalid id' }) }));
    await expect(apiFetch('/api/places/x')).rejects.toThrow('Invalid id');
  });

  it('gives a clear message when the host answers with an HTML page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError("Unexpected token '<'"); },
    }));
    await expect(apiFetch('/api/places')).rejects.toThrow('The server had a problem (502)');
  });

  it('gives a clear message when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiFetch('/api/places')).rejects.toThrow('Cannot reach the server');
  });
});
