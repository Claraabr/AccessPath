# AccessPath

**Live app:** https://access-path-brown.vercel.app

**API:** https://accesspath-api-0yy7.onrender.com (health check: [/api/health](https://accesspath-api-0yy7.onrender.com/api/health))

The API runs on Render's free plan and sleeps when nobody uses it: the first request after a while can take about 50 seconds.

AccessPath helps people with reduced mobility in Lebanon check whether a place is accessible before they go: a wheelchair user, a parent with a stroller, a grandparent with a cane, someone on crutches.

- **AccessPath** – places (cafes, hotels, shops, pharmacies…) declare their accessibility (step-free entrance, elevator, accessible toilets, parking), with a photo of each. Visitors leave reviews with a rating, a comment and a photo, so everyone can check if the place tells the truth. "Near me" uses the position of the phone to show the closest places first.
- **AccessFix** – a small marketplace where equipment suppliers rent or sell ramps, wheelchairs and other equipment. People and places can send a request, and "Near me" shows the closest suppliers first. A place with no step-free entrance or no elevator sees, on its own page, the ramps or stair climbers closest to it.

Capstone project for 020WBPES3 – Web Programming (ESIB, USJ).
Team: Clara Abou Rjeily (230718), Denise Aboukhater (240810).

## Features

- **Look around as a guest.** Without an account you can search places, open them, read the reviews and browse AccessFix.
- **Accounts with a role.** Sign up as a visitor, a business or a supplier, then log in to write. The session lasts one hour; after that the app logs you out and asks you to log in again.
- **Search places** by name, category and the four criteria (step-free entrance, elevator, accessible toilets, parking). The results show on a map and in a list.
- **Near me.** The browser gives your position and the places, or the equipment, come closest first, with the distance.
- **Place page.** Each criterion with its photo and how many visitors found it ("Found by 3 of 4 visitors"), the other photos of the place, and the reviews with the owner's replies.
- **Reviews.** A visitor ticks the criteria they found there, rates the place from 1 to 5, adds a comment and a photo, and can edit or delete their review (one per place). This is how visitors check what the place declares.
- **My place (business).** Set up one place, edit its details, photos and criteria, or delete it. The address is turned into a point on the map.
- **My reviews (business).** Read the reviews of your place, reply, change or delete a reply, and see the ones still waiting for an answer.
- **AccessFix suggestions.** A place with no step-free entrance or no elevator sees the ramps or stair climbers closest to it.
- **AccessFix marketplace.** Suppliers post, edit and delete listings to rent or sell equipment. Anyone can search them by type, rent or sale, and area.
- **Requests.** Visitors and businesses ask to rent or buy and can cancel while it is pending. Suppliers accept or decline.
- **Responsive.** On a computer the menu is a column of icons that opens on hover; on a phone it folds behind a Menu button.

## Changes since the proposal

The core of the proposal is here: places with their four criteria on a list and a map, search and filters, reports from visitors with the criteria they found, a comment and a photo, and AccessFix with listings and requests. Some parts changed while we built it:

| In the proposal | In the app | Why |
|---|---|---|
| Two roles: `user` and `business` | Three roles: `user`, `venue` (a place) and `supplier` (equipment) | The proposal's business did two different jobs: describing its place and renting equipment. With two roles each home page shows only what that account needs, and a place can ask a supplier for a ramp. |
| Any user adds a place | A `venue` account sets up its own place, one per account | Someone answers for the information: the owner keeps it up to date and replies to reviews, and the same place is not added twice. Visitors still check it: each review says which criteria they found, and the place page shows "Found by N of M visitors" next to what the place declares. |
| A report: tick the criteria, a comment, a photo | A review: the same, plus a 1–5 rating and the owner's reply | The rating gives the overall score of the nice-to-haves (the average on the place page). The `Report` model became `Review`, and its router `reviews`. |
| Photos on Cloudinary | Photos sent to our API and kept in MongoDB (`Photo` model, `/api/photos`) | Cloudinary does not accept accounts from Lebanon. The browser shrinks each photo to 1200 px before sending it. |
| Five models | Six: the `Photo` model was added | See the line above. |

Added beyond the proposal: Near me, owner replies, AccessFix suggestions for a place, GitHub Actions CI. Not done from the nice-to-haves: favorites, flagging a report, the admin role, listings on the places map, ratings after a rental and messages; "My requests" and "My reviews" cover part of the profile page.

## Accounts and roles

You choose your role when you sign up.

| Role | Who | Can |
|---|---|---|
| `user` | a person with reduced mobility, or someone who helps one | search places, write reviews, rent or buy equipment for themselves |
| `venue` | a business (restaurant, hotel, supermarket…) | one account = one place: set it up with photos, declare its accessibility, read and answer its reviews, update it when something changes, request equipment for the place |
| `supplier` | a business that rents or sells equipment | post listings (ramps, wheelchairs…), accept or decline requests from people and businesses |

Anyone can look around without an account: reading places, reviews and listings is public, in the API and in the app. Writing anything needs an account with the right role.

## Tech stack

| Part | Choice |
|---|---|
| Front end | React (Vite), Leaflet + react-leaflet for the map |
| Back end | Node.js, Express 5 (REST API under `/api`) |
| Database | MongoDB Atlas with Mongoose |
| Auth | bcrypt for passwords, JWT (1 hour) sent as `Authorization: Bearer`, role checks on the server |
| Third-party APIs | Nominatim (address → coordinates), MapTiler (map tiles) |
| Photos | sent to our own API and kept in MongoDB (`POST /api/photos`), shrunk to 1200 px in the browser first |

## Architecture

```
 Browser: React app (Vercel)
   │   map tiles ──────────────► MapTiler
   │
   │   HTTPS + JSON, Authorization: Bearer <JWT>
   ▼
 REST API: Express on Node.js (Render)
   │   address → lat/lng ──────► Nominatim (OpenStreetMap)
   │   photos ─────────────────► kept in MongoDB, served at /api/photos/:id
   │
   │   Mongoose
   ▼
 MongoDB Atlas: users, places, reviews, listings, requests, photos
```

- The React app never talks to the database. It calls the API with `apiFetch`, which adds the token to every request.
- In the API, a protected route first goes through `requireAuth` (who are you? 401), then `requireRole` when only some roles may use it (403). Signup and login also go through `validate` (zod, 400). The route itself only touches what belongs to `req.userId` (404 otherwise).
- The server keeps no session: the JWT is sent with every request.
- A push to `main` runs the tests on GitHub Actions. Render deploys the API only after they pass; Vercel rebuilds the client.

## Project structure

```
AccessPath/
├── .github/workflows/ci.yml # tests on every push (GitHub Actions)
├── client/                  # React app (Vite)
│   ├── src/
│   │   ├── api/             # client.js (apiFetch), upload.js (photos)
│   │   ├── auth/            # AuthContext.jsx (who is logged in)
│   │   ├── components/      # forms, map, badges…
│   │   ├── hooks/           # useApi.js
│   │   ├── pages/           # one file per screen
│   │   └── App.jsx          # the routes (React Router), one URL per page
│   └── .env.example
├── server/                  # Express API
│   ├── models/              # User, Place, Review, Listing, Request, Photo
│   ├── routes/              # auth, places, reviews, listings, requests, photos
│   ├── middleware/          # requireAuth (401), requireRole (403), validate (zod, 400)
│   ├── auth/token.js        # sign / verify JWT
│   ├── utils/               # geocode (Nominatim), escapeRegex
│   ├── tests/               # Vitest + supertest
│   ├── app.js               # the Express app: helmet, rate limits, routes
│   ├── server.js            # checks .env, connects to MongoDB, listens
│   └── .env.example
├── docs/wireframes/         # the first screens, drawn in Figma
├── SECURITY.md              # the security lab: attacks, fixes, results
├── PERFORMANCE.md           # the Lighthouse audit: scores before, fixes, after
└── CREDITS.md               # authors and licenses of the demo photos
```

## Data model

Six MongoDB collections (Mongoose models in `server/models/`). Every document also has `createdAt` and `updatedAt`.

| Model | Fields | Links |
|---|---|---|
| `User` | name, email (unique), passwordHash, role (`user` / `venue` / `supplier`) | – |
| `Place` | name, category, address, lat, lng, stepFree, elevator, toilets, parking, photos (10 max), accessPhotos (one photo per criterion) | `ownerId` → User (a venue, one place each) |
| `Review` | rating (1–5), comment, photoUrl, found (the four criteria the visitor found), reply and repliedAt (the answer of the owner) | `placeId` → Place, `userId` → User (one review per user and place) |
| `Listing` | title, type (ramp, wheelchair…), mode (`rent` / `sale`), price, area, photoUrl, lat, lng (found from the area) | `ownerId` → User (a supplier) |
| `Request` | message, status (`pending` / `accepted` / `declined`) | `listingId` → Listing, `seekerId` → User (a user or a venue) |
| `Photo` | contentType (JPEG, PNG or WebP), data (the image itself) | `ownerId` → User (who sent it) |

Deleting a place deletes its reviews; deleting a listing deletes its requests.

## Pages

Each role has its own home page and menu. On a computer the menu is a thin column of icons that opens when you move the mouse on it. A URL that is not for your role sends you back to your home page. Without an account, the app has `/` (search), `/places/:id`, `/accessfix`, `/accessfix/:id` and `/login`, read-only.

| URL | user | venue | supplier |
|---|---|---|---|
| `/` | "Welcome back", then search places (map + list, Near me) | "Welcome back", then my place as visitors see it, with Edit (photos, details, criteria) and AccessFix equipment for what is missing | "Welcome back", then my listings: post, edit, delete |
| `/places/:id` | a place, its criteria with their photos, its other photos and reviews; write / edit / delete my review | – | – |
| `/accessfix` | search equipment, Near me | search equipment, Near me | – |
| `/accessfix/:id` | a listing, ask to rent or buy | a listing, ask to rent or buy | – |
| `/my-reviews` | – | the reviews of my place: reply, edit or delete my reply, see the ones waiting | – |
| `/my-requests` | the requests I sent | the requests I sent | – |
| `/received` | – | – | accept or decline requests |

## Wireframes

The first version of the screens, drawn in Figma before coding ([prototype](https://www.figma.com/proto/UP7gTGXDShPCbOrdgUSDTp/AccessPath-%E2%80%94-Prototype-pitch?node-id=22-229&p=f&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1)). The labels are in French; the images are in [`docs/wireframes/`](docs/wireframes).

| Wireframe | In the app |
|---|---|
| [01 Home and search](docs/wireframes/01-home-search.png) | `/` for a visitor: search, filters, map, Near me |
| [02 Place page](docs/wireframes/02-place-page.png) | `/places/:id`: the four criteria with their photos |
| [03 AccessFix, rent equipment](docs/wireframes/03-accessfix-rent-equipment.png) | `/accessfix`: search listings, Near me |
| [04 WhatsApp assistant](docs/wireframes/04-whatsapp-assistant.png) | not built (an idea for later) |
| [05 Business space](docs/wireframes/05-business-space.png) | `/` for a venue: my place, AccessFix suggestions |
| [06 Log in / sign up](docs/wireframes/06-login-signup.png) | the login and signup screen, with the role |
| [07 Place reviews](docs/wireframes/07-place-reviews.png) | reviews and owner replies on the place page |
| [08 AccessFix listing](docs/wireframes/08-accessfix-listing.png) | `/accessfix/:id`: ask to rent or buy |
| [09 My requests](docs/wireframes/09-accessfix-my-requests.png) | `/my-requests` |
| [10 Supplier, my listings](docs/wireframes/10-supplier-my-listings.png) | `/` for a supplier: post, edit, delete |
| [11 Supplier, requests received](docs/wireframes/11-supplier-requests-received.png) | `/received`: accept or decline |
| [12 Business, edit my place](docs/wireframes/12-business-edit-place.png) | Edit on my place: details, criteria, photos |

<p><img src="docs/wireframes/01-home-search.png" width="150" alt=""> <img src="docs/wireframes/02-place-page.png" width="150" alt=""> <img src="docs/wireframes/03-accessfix-rent-equipment.png" width="150" alt=""> <img src="docs/wireframes/04-whatsapp-assistant.png" width="150" alt=""></p>
<p><img src="docs/wireframes/05-business-space.png" width="150" alt=""> <img src="docs/wireframes/06-login-signup.png" width="150" alt=""> <img src="docs/wireframes/07-place-reviews.png" width="150" alt=""> <img src="docs/wireframes/08-accessfix-listing.png" width="150" alt=""></p>
<p><img src="docs/wireframes/09-accessfix-my-requests.png" width="150" alt=""> <img src="docs/wireframes/10-supplier-my-listings.png" width="150" alt=""> <img src="docs/wireframes/11-supplier-requests-received.png" width="150" alt=""> <img src="docs/wireframes/12-business-edit-place.png" width="150" alt=""></p>

## Milestones

Each milestone has a Git tag on the commit that completes it. The repository history starts on 15 November with one commit that already contains milestones 1 to 3. The tags were added on 26 November to mark those commits, and the wireframes above were added to the repository the same day.

| Milestone | Tag | Commit | Date | What it contains |
|---|---|---|---|---|
| 1. Scaffold, wireframes, schema | `milestone-1` | `c95101f` | 15 Nov | React app with routing, Express with `/api/health`, MongoDB through `MONGODB_URI`, `.env` in `.gitignore`, the five models |
| 2. Core back end | `milestone-2` | `c95101f` | 15 Nov | signup and login with bcrypt, JWT, `requireAuth` (401) and `requireRole` (403), CRUD routes, zod validation |
| 3. Front end integrated | `milestone-3` | `c95101f` | 15 Nov | React calls the API, login and logout, search, reviews, AccessFix, Nominatim and the map, a fluid layout (wrapping rows and grids; the phone media queries came on 18 Nov) |
| 4. Deployment | `milestone-4` | `bafbb9f` | 18 Nov | client on Vercel, API on Render, database on Atlas, secrets in the hosts' environment, live URLs at the top of this README |

Later commits added Near me, owner replies, AccessFix suggestions, CI, the security and performance reports and the photo upload.

## Run it on your computer

You need **Node.js 20 or newer** (`node -v` to check) and a free **MongoDB Atlas** cluster.

### 1. Get the code

```bash
git clone <repo-url> AccessPath
cd AccessPath
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill it in:

| Variable | What to put |
|---|---|
| `PORT` | `3000` |
| `MONGODB_URI` | your Atlas connection string, with `accesspath` as the database name: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/accesspath`. With MongoDB installed on your computer: `mongodb://` followed by its address and port 27017, then `/accesspath` |
| `JWT_SECRET` | a long random string: run `node -p "crypto.randomBytes(32).toString('hex')"` and paste the result |
| `CLIENT_ORIGIN` | the address of the client, no `/` at the end: on your computer, the address Vite shows when you start the client (port 5173). Several origins are separated by commas, e.g. to also allow `npm run preview` (port 4173) |

In Atlas, check **Network Access**: your IP address must be allowed, otherwise the connection times out.

### 3. Set up the client

```bash
cd ../client
npm install
cp .env.example .env
```

Open `client/.env`:

| Variable | What to put |
|---|---|
| `VITE_API_URL` | the address of the API: on your computer, your own server on port 3000 |
| `VITE_MAPTILER_KEY` | a free key from [cloud.maptiler.com](https://cloud.maptiler.com) → API Keys. Empty = standard OpenStreetMap tiles |
| `VITE_MAPTILER_MAP` | optional, the id of a map customized in English. Empty = `streets-v2` |

Everything that starts with `VITE_` is sent to the browser, so it never holds a secret. The secrets (database password, JWT secret) stay in `server/.env`.

### 4. Start both parts (two terminals)

```bash
# terminal 1
cd server
npm run dev
# → connected to MongoDB
# → API listening on :3000
```

```bash
# terminal 2
cd client
npm run dev
# → Local: the address of the client (port 5173)
```

Open the address Vite shows, sign up and try it. To see every feature, create one account of each role: a `venue` adds a place, a `user` reviews it, a `supplier` posts a ramp, then the venue or the user requests it.

### 5. Demo data (optional)

```bash
cd server
node scripts/seed.js
```

This adds 84 places in 30 towns of Lebanon, from Tripoli, Halba, Ehden and Bsharri in the north to Saida, Jezzine and Tyre in the south, with Beirut, Mount Lebanon and the Bekaa in between, and 13 around Mansourieh and Mar Roukoz, where the demo takes place: hotels, supermarkets, restaurants, cafes, shops, pharmacies, banks, hospitals, universities, public offices and a library, each with its accessibility, a cover photo and a photo of one of its criteria. Every category has places with each criterion, so a search like "cafe with an elevator" gives results. It also adds 9 visitors who left 233 reviews (2 to 5 per place, some with a reply of the owner), 6 equipment suppliers with 34 listings from Tripoli to Saida (each with a photo and a position for "Near me"), and 15 requests: people who need equipment for themselves or a relative, and businesses that need it for their place. The business names are made up, so no real business gets fake reviews, but the towns and the photos are real. Every demo account uses the password `demo1234`:

| Role | Email |
|---|---|
| user | `vasken-sarkis@demo.accesspath.lb` |
| venue | `vasken-s-bakery@demo.accesspath.lb` |
| supplier | `mobility-vs@demo.accesspath.lb` |

Running it again replaces the old demo data instead of adding it twice. To fill the online database, run it with the Atlas string: `MONGODB_URI="mongodb+srv://..." node scripts/seed.js`.

Each place has a photo of its street and a photo of what matters for access (the ramp or the steps at the door, the elevator, the toilets or the parking), shown next to that criterion on the place page. No photo is used twice. All the photos come from Wikimedia Commons, with their authors and licenses in [CREDITS.md](CREDITS.md).

## Deployment

Three hosts, one app: the database on **MongoDB Atlas**, the API on **Render**, the React app on **Vercel**. Every push to `main` redeploys both.

**Atlas.** A free cluster, a database user, and in Network Access `0.0.0.0/0` (Render does not have a fixed IP).

**Render** (Web Service, connected to this repo):

| Field | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Environment | `MONGODB_URI` (Atlas string), `JWT_SECRET` (a new long random string, not the dev one), `CLIENT_ORIGIN` (the Vercel URL, no `/` at the end), `NODE_ENV=production` |

Render gives the port in `PORT`, the server reads it. Check: `https://<api>.onrender.com/api/health` answers `{"status":"ok"}`. The free plan sleeps when nobody uses it, so the first request can take about 50 seconds.

**Vercel** (connected to this repo):

| Field | Value |
|---|---|
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_API_URL` (the Render URL, no `/` at the end), `VITE_MAPTILER_KEY`, `VITE_MAPTILER_MAP` |

`client/vercel.json` sends every URL to `index.html`, so refreshing `/places/…` or `/accessfix` does not give a 404. `VITE_` variables are read at build time: after changing one, redeploy.

## API

All routes start with `/api`. 🔒 = needs a token (401 without one). The role in brackets is checked on the server (403 otherwise).

| Method | Route | Who | What |
|---|---|---|---|
| POST | `/auth/signup` | anyone | create an account, returns a token |
| POST | `/auth/login` | anyone | returns a token |
| GET | `/auth/me` | 🔒 | the logged-in account and its role |
| GET | `/places?search=&category=&criteria=stepFree,elevator` | anyone | search places |
| GET | `/places/mine` | 🔒 venue | my place (`null` if not set up yet) |
| GET | `/places/:id` | anyone | one place |
| POST | `/places` | 🔒 venue | set up my place, one per venue account (the address is geocoded) |
| PATCH / DELETE | `/places/:id` | 🔒 venue, owner | edit / delete my place (and its reviews) |
| GET | `/places/:id/reviews` | anyone | reviews of a place |
| POST | `/places/:id/reviews` | 🔒 user | one review per user and place |
| PATCH / DELETE | `/reviews/:id` | 🔒 author | edit / delete my review |
| PUT / DELETE | `/reviews/:id/reply` | 🔒 venue, owner of the place | write or change / delete my reply to a review |
| GET | `/listings?type=&mode=&area=` | anyone | search listings |
| GET | `/listings/mine` | 🔒 supplier | my listings |
| GET | `/listings/:id` | anyone | one listing with the supplier's contact |
| POST | `/listings` | 🔒 supplier | post a listing |
| PATCH / DELETE | `/listings/:id` | 🔒 supplier, owner | edit / delete my listing (and its requests) |
| POST | `/listings/:id/requests` | 🔒 user or venue | ask to rent or buy |
| GET | `/requests/sent` | 🔒 | requests I sent |
| GET | `/requests/received` | 🔒 supplier | requests on my listings |
| PATCH | `/requests/:id` | 🔒 supplier, owner | `{ "status": "accepted" }` or `"declined"` |
| DELETE | `/requests/:id` | 🔒 sender | cancel a pending request |
| POST | `/photos` | 🔒 | send a photo (the body is the image, JPEG, PNG or WebP, 2 MB max), returns its URL |
| GET | `/photos/:id` | anyone | the photo itself, so `<img src>` works |

## Tests

```bash
cd server && npm test   # API: 401, 400, 404, helmet headers, tokens, photo links, criteria found, login rate limit (no database needed)
cd client && npm test   # components: PlaceForm, ReviewForm, Stars; distances for Near me; apiFetch error messages
cd client && npm run lint   # ESLint (React hooks rules), no errors
```

Both use Vitest. The server tests import `app.js` with supertest, so they need no port and no database.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request (session 23): a clean GitHub machine installs the server and the client with `npm ci`, runs `npm test` in both, runs ESLint on the client and builds it. A red check on GitHub means something is broken before it reaches Render or Vercel. On Render, Auto-Deploy is set to "After CI checks pass", so a failing commit is never deployed.

## Security

Passwords are hashed with bcrypt, every private route needs a token, and every edit or delete is filtered by the owner (`req.userId`), so nobody can touch someone else's place, review, listing or request. The API also uses helmet, rate limits on login, zod validation and `sanitizeFilter`. The details, attack by attack, are in [SECURITY.md](SECURITY.md).

## Common problems

| Problem | Fix |
|---|---|
| `DB connection failed` … timeout | allow your IP in Atlas → Network Access |
| `Missing env var: …` when the server starts | that variable is missing in `server/.env` |
| `429 Too many failed attempts` at login | 5 failed tries per 15 minutes; wait, or restart the server while developing |
| CORS error in the browser console | `CLIENT_ORIGIN` must be exactly the address of the client, no `/` at the end |
| Requests go to `undefined/api/...` | `VITE_API_URL` is missing in `client/.env`, then restart `npm run dev` |
| "Address not found on the map" | write a fuller address, e.g. `Rue Monot, Beirut` |
