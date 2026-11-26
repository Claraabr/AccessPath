import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect } from 'vitest';
import app from '../app.js';
import { isPhotoUrl } from '../utils/isPhotoUrl.js';
import { readFound } from '../utils/criteria.js';

// No port and no database: these requests are stopped before Mongo is called

describe('auth', () => {
  it('rejects a missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const fake = jwt.sign({ sub: 'u1' }, 'not-our-secret');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fake}`);
    expect(res.status).toBe(401);
  });

  it('rejects a signup with a short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Clara', email: 'clara@test.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  it('rejects a signup with an unknown role', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'password123', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('rejects an object instead of an email (injection)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('places', () => {
  it('needs a token to add a place', async () => {
    const res = await request(app)
      .post('/api/places')
      .send({ name: 'Cafe', category: 'cafe', address: 'Hamra, Beirut' });
    expect(res.status).toBe(401);
  });

  it('refuses a search sent twice (array instead of text)', async () => {
    const res = await request(app).get('/api/places?search=a&search=b');
    expect(res.status).toBe(400);
  });
});

describe('reviews', () => {
  it('needs a token to reply to a review', async () => {
    const res = await request(app)
      .put('/api/reviews/6b007ef8c4e4ddecfc17cbaa/reply')
      .send({ text: 'Thank you!' });
    expect(res.status).toBe(401);
  });
});

describe('photos', () => {
  it('needs a token to send a photo', async () => {
    const res = await request(app)
      .post('/api/photos')
      .set('Content-Type', 'image/jpeg')
      .send(Buffer.from('not really a photo'));
    expect(res.status).toBe(401);
  });

  it('refuses a file that is not a photo', async () => {
    const token = jwt.sign({ sub: '6b007ef8c4e4ddecfc17cbaa' }, 'test-secret');
    const res = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'text/plain')
      .send('hello');
    expect(res.status).toBe(400);
  });

  it('refuses a photo id that is not an id', async () => {
    const res = await request(app).get('/api/photos/not-an-id');
    expect(res.status).toBe(400);
  });
});

describe('criteria found in a review', () => {
  it('keeps only the 4 criteria, and only true when it is really true', () => {
    const found = readFound({ found: { stepFree: true, elevator: 'yes', parking: false, admin: true } });
    expect(found).toEqual({ stepFree: true, elevator: false, toilets: false, parking: false });
  });
});

describe('photo links', () => {
  it('accepts an http(s) link or nothing', () => {
    expect(isPhotoUrl('https://commons.wikimedia.org/wiki/Special:FilePath/x.jpg')).toBe(true);
    expect(isPhotoUrl('')).toBe(true);
  });

  it('refuses anything else', () => {
    expect(isPhotoUrl('javascript:alert(1)')).toBe(false);
    expect(isPhotoUrl('my photo')).toBe(false);
  });
});

describe('the app', () => {
  it('answers a broken JSON body with 400, not 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "a@b.com",');
    expect(res.status).toBe(400);
  });

  it('answers an unknown route with a JSON 404', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('sends the helmet headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

// Last, because it uses up the login attempts of this test run.
// A wrong body is a failed attempt (400); after 5 failures the API answers 429.
describe('login rate limit', () => {
  it('blocks after 5 failed attempts', async () => {
    let status;
    for (let i = 0; i < 6; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 123 });
      status = res.status;
    }
    expect(status).toBe(429);
  });
});
