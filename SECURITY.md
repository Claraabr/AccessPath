# Security

We attacked our own API with the seven checks of the Session 21 lab, then fixed what was open.
For each one: the attack, what the API answered before, the fix, and what it answers now.

All commands use `$API`, the address of the API (the Render URL, or the server running on your computer, port 3000). `$TOKEN` is a token from `/api/auth/login`.
The fixes are also covered by the automated tests in `server/tests/api.test.js` (`npm test` in `server/`).

## Summary

| Hole | Before | After |
|---|---|---|
| Injection | open (500) | fixed (400) |
| Brute force | open | fixed (429 after 5 tries) |
| Headers | open | fixed (helmet) |
| Secrets | open (server ran without `JWT_SECRET`) | fixed (fails at startup) |
| Mass assignment | mostly safe | fixed (unknown role refused) |
| IDOR | already safe | no change needed |
| XSS | already safe | no change needed |

## 1. Injection

**Attack:** send an object instead of an email at login.

```bash
curl -i -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": "x"}'
```

**Before:** `500 {"error":"Something went wrong"}`. The route called `.toLowerCase()` on the object and crashed.

**Fix:**
- `server/middleware/validate.js`: zod schemas for signup and login, so the email must be a string.
- `server/app.js`: `mongoose.set('sanitizeFilter', true)` as a backstop for every query. Our own `$regex` and `$in` are wrapped in `mongoose.trusted()`.
- `GET /api/places` and `GET /api/listings` only accept plain strings in the query.

**After:** `400` with the zod message (expected string, received object). Mongo never sees the request.

Same family: `GET /api/places?search=(` used to answer 500, because `(` is not a valid regex. The search text is now escaped (`server/utils/escapeRegex.js`), so it answers `200 []`.

## 2. Brute force

**Attack:** 20 wrong passwords in a row.

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/api/auth/login \
    -H "Content-Type: application/json" -d '{"email":"clara@test.com","password":"wrong"}'
done
```

**Before:** twenty `401`. Nothing slowed the guessing down.

**Fix:** `express-rate-limit` in `server/app.js`: 5 login attempts per 15 minutes, and 300 requests per 15 minutes for the whole API. The JSON body is also capped at 10 kb.

**After:** five `401`, then `429 {"error":"Too many attempts. Try again later."}`.

## 3. Headers

**Attack:**

```bash
curl -I $API/api/health
```

**Before:** `X-Powered-By: Express` (tells everyone what we run), no `Content-Security-Policy`, no `Strict-Transport-Security`.

**Fix:** `app.use(helmet())`, first thing in `server/app.js`.

**After:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` are there, and `X-Powered-By` is gone.

## 4. Secrets

**Attack:** look for secrets in Git, then start the server with a broken `.env`.

```bash
git log -p | grep -i -E "JWT_SECRET=|MONGODB_URI=mongodb"
```

**Before:** nothing in Git (`.env` was already in `.gitignore`), but the server started even without `JWT_SECRET`, and the first login failed with a 500 (`secretOrPrivateKey must have a value`).

**Fix:** `server/server.js` checks `MONGODB_URI`, `JWT_SECRET` and `CLIENT_ORIGIN` before anything else. Only `.env.example` (names, no values) is committed. The JWT secret is 64 random hex characters.

**After:** `Error: Missing env var: JWT_SECRET` at startup. The `git log` search finds only the placeholders of `.env.example`.

## 5. Mass assignment

**Attack:** try to choose the owner or the role in the body.

```bash
curl -i -X POST $API/api/places -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","category":"cafe","address":"Hamra, Beirut","ownerId":"<someone else id>"}'

curl -i -X POST $API/api/auth/signup -H "Content-Type: application/json" \
  -d '{"name":"Eve","email":"eve@test.com","password":"password123","role":"admin"}'
```

**Before:** the `ownerId` in the body was already ignored: every route takes the owner from the token (`req.userId`) and only copies the fields it allows. An unknown role at signup silently became `user`.

**Fix:** the signup schema only allows `user`, `venue` or `supplier`, and drops every other key.

**After:** the place belongs to the logged-in venue; signup with `"role": "admin"` answers `400`.

## 6. IDOR (someone else's data)

**Attack:** venue B edits or deletes venue A's place, user B deletes user A's review.

```bash
curl -i -X DELETE $API/api/places/<place of A> -H "Authorization: Bearer $TOKEN_OF_B"
curl -i -X DELETE $API/api/reviews/<review of A> -H "Authorization: Bearer $TOKEN_OF_B"
```

**Before and after:** `404`. Every PATCH and DELETE looks for `{ _id, ownerId: req.userId }` (or `userId` for reviews, `seekerId` for requests), so B cannot even tell the record exists. Accepting or declining a request checks that the listing behind it belongs to the supplier.

## 7. XSS

**Attack:** a review comment `<img src=x onerror=alert(1)>`, then open the place page.

**Before and after:** the comment shows as text. React escapes everything we render, we never use `dangerouslySetInnerHTML`, and the map popups are React components, not HTML strings. Helmet's Content-Security-Policy adds a second layer on the API.

## Other fixes found on the way

- A broken JSON body answered `500`, it now answers `400`.
- An unknown route answered Express's HTML 404 page, it now answers `404 {"error":"Not found"}`.
- A body over 10 kb answers `413`.
- Photo upload (`POST /api/photos`): a token is needed, only JPEG, PNG and WebP are read, 2 MB at most (`413` above), anything else answers `400`. The photo is served with `Cross-Origin-Resource-Policy: cross-origin` only on that route, so the React app on Vercel can show it while helmet keeps the stricter default everywhere else.
