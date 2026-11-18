# AccessPath

**Live app:** https://access-path-brown.vercel.app

**API:** https://accesspath-api-0yy7.onrender.com (health check: [/api/health](https://accesspath-api-0yy7.onrender.com/api/health))

The API runs on Render's free plan and sleeps when nobody uses it: the first request after a while can take about 50 seconds.

AccessPath helps people with reduced mobility in Lebanon check whether a place is accessible before they go: a wheelchair user, a parent with a stroller, a grandparent with a cane, someone on crutches.

- **AccessPath** – places (cafes, hotels, shops, pharmacies…) declare their accessibility (step-free entrance, elevator, accessible toilets, parking). Visitors leave reviews with a rating, a comment and a photo, so everyone can check if the place tells the truth.
- **AccessFix** – a small marketplace where equipment suppliers rent or sell ramps, wheelchairs and other equipment. People and places can send a request; a place that is not accessible yet can rent a ramp.

Capstone project for 020WBPES3 – Web Programming (ESIB, USJ).
Team: Clara Abou Rjeily (230718), Denise Aboukhater (240810).

## Accounts and roles

You choose your role when you sign up.

| Role | Who | Can |
|---|---|---|
| `user` | a person | search places, write reviews, request equipment |
| `venue` | a place (cafe, hotel, shop…) | one account = one place: set it up with photos, declare its accessibility, read its reviews, request equipment |
| `supplier` | an equipment business | post listings, accept or decline requests |

Everybody has to log in before seeing the app.

## Tech stack

| Part | Choice |
|---|---|
| Front end | React (Vite), Leaflet + react-leaflet for the map |
| Back end | Node.js, Express 5 (REST API under `/api`) |
| Database | MongoDB Atlas with Mongoose |
| Auth | bcrypt for passwords, JWT (1 hour) sent as `Authorization: Bearer`, role checks on the server |
| Third-party APIs | Nominatim (address → coordinates), MapTiler (map tiles), Cloudinary (photo upload) |

## Project structure

```
AccessPath/
├── .github/workflows/ci.yml # tests on every push (GitHub Actions)
├── client/                  # React app (Vite) – http://localhost:5173
│   ├── src/
│   │   ├── api/             # client.js (apiFetch), upload.js (Cloudinary)
│   │   ├── auth/            # AuthContext.jsx (who is logged in)
│   │   ├── components/      # forms, map, badges…
│   │   ├── hooks/           # useApi.js
│   │   ├── pages/           # one file per screen
│   │   └── App.jsx          # the routes (React Router), one URL per page
│   └── .env.example
├── server/                  # Express API – http://localhost:3000
│   ├── models/              # User, Place, Review, Listing, Request
│   ├── routes/              # auth, places, reviews, listings, requests
│   ├── middleware/          # requireAuth (401), requireRole (403), validate (zod, 400)
│   ├── auth/token.js        # sign / verify JWT
│   ├── utils/               # geocode (Nominatim), escapeRegex
│   ├── tests/               # Vitest + supertest
│   ├── app.js               # the Express app: helmet, rate limits, routes
│   ├── server.js            # checks .env, connects to MongoDB, listens
│   └── .env.example
├── SECURITY.md              # the security lab: attacks, fixes, results
└── PERFORMANCE.md           # the Lighthouse audit: scores before, fixes, after
```

## Data model

Five MongoDB collections (Mongoose models in `server/models/`). Every document also has `createdAt` and `updatedAt`.

| Model | Fields | Links |
|---|---|---|
| `User` | name, email (unique), passwordHash, role (`user` / `venue` / `supplier`) | – |
| `Place` | name, category, address, lat, lng, stepFree, elevator, toilets, parking, photos (10 max) | `ownerId` → User (a venue, one place each) |
| `Review` | rating (1–5), comment, photoUrl | `placeId` → Place, `userId` → User (one review per user and place) |
| `Listing` | title, type (ramp, wheelchair…), mode (`rent` / `sale`), price, area, photoUrl | `ownerId` → User (a supplier) |
| `Request` | message, status (`pending` / `accepted` / `declined`) | `listingId` → Listing, `seekerId` → User (a user or a venue) |

Deleting a place deletes its reviews; deleting a listing deletes its requests.

## Pages

Each role has its own home page and menu. A URL that is not for your role sends you back to your home page.

| URL | user | venue | supplier |
|---|---|---|---|
| `/` | search places (map + list) | my place as visitors see it, with Edit (photos, details, criteria) | my listings: post, edit, delete |
| `/places/:id` | a place, its photos and reviews; write / edit / delete my review | – | – |
| `/accessfix` | search equipment | search equipment | – |
| `/accessfix/:id` | a listing, ask to rent or buy | a listing, ask to rent or buy | – |
| `/my-requests` | the requests I sent | the requests I sent | – |
| `/received` | – | – | accept or decline requests |

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
| `MONGODB_URI` | your Atlas connection string, with `accesspath` as the database name: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/accesspath`. With MongoDB installed locally: `mongodb://127.0.0.1:27017/accesspath` |
| `JWT_SECRET` | a long random string: run `node -p "crypto.randomBytes(32).toString('hex')"` and paste the result |
| `CLIENT_ORIGIN` | `http://localhost:5173` (no `/` at the end). Several origins are separated by commas, e.g. `http://localhost:5173,http://localhost:4173` to also use `npm run preview` |

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
| `VITE_API_URL` | `http://localhost:3000` |
| `VITE_MAPTILER_KEY` | a free key from [cloud.maptiler.com](https://cloud.maptiler.com) → API Keys. Empty = standard OpenStreetMap tiles |
| `VITE_MAPTILER_MAP` | optional, the id of a map customized in English. Empty = `streets-v2` |
| `VITE_CLOUDINARY_CLOUD_NAME` | your Cloudinary cloud name. Empty = no photo field |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | the name of an **unsigned** upload preset (Cloudinary → Settings → Upload) |

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
# → Local: http://localhost:5173/
```

Open http://localhost:5173, sign up and try it. To see every feature, create one account of each role: a `venue` adds a place, a `user` reviews it, a `supplier` posts a ramp, then the venue or the user requests it.

### 5. Demo data (optional)

```bash
cd server
node scripts/seed.js
```

This adds 16 places in 8 towns of Lebanon (Beirut, Bourj Hammoud, Jounieh, Byblos, Batroun, Tripoli, Saida, Tyre, Zahle): hotels, supermarkets, restaurants, cafes, a shop and a pharmacy, each with its accessibility and 2 photos. It also adds 14 reviews, 14 equipment listings and a few requests. The business names are made up, so no real business gets fake reviews, but the towns and the photos are real. Every demo account uses the password `demo1234`:

| Role | Email |
|---|---|
| user | `rana@demo.accesspath.lb` |
| venue | `hotel-cedar-bay@demo.accesspath.lb` |
| supplier | `georges-medical-supply@demo.accesspath.lb` |

Running it again replaces the old demo data instead of adding it twice. To fill the online database, run it with the Atlas string: `MONGODB_URI="mongodb+srv://..." node scripts/seed.js`.

Each place has a photo of its street and a photo of what matters for access (the ramp or the steps at the door, the elevator, the toilets or the parking). No photo is used twice. They all come from Wikimedia Commons:

| Photo | Author | License |
|---|---|---|
| [Another rainy Beirut day](https://commons.wikimedia.org/wiki/File:Another_rainy_Beirut_day.jpg) | craigfinlay | CC BY 2.0 |
| [Hamra Street, Beirut (1)](https://commons.wikimedia.org/wiki/File:Hamra_Street,_Beirut_(1).jpg) | Radosław Botev | CC BY 3.0 PL |
| [Beirut Bourj Hammoud - 2018 - 08](https://commons.wikimedia.org/wiki/File:Beirut_Bourj_Hammoud_-_2018_-_08.jpg) | Daieuxetdailleurs | CC BY-SA 4.0 |
| [Beirut Bourj Hammoud - 2018 - 11](https://commons.wikimedia.org/wiki/File:Beirut_Bourj_Hammoud_-_2018_-_11.jpg) | Daieuxetdailleurs | CC BY-SA 4.0 |
| [Bayofjouniehviewfromrabieh2](https://commons.wikimedia.org/wiki/File:Bayofjouniehviewfromrabieh2.JPG) | Karlaboumansour | Public domain |
| [3133 (8)jounieh](https://commons.wikimedia.org/wiki/File:3133_(8)jounieh.JPG) | FunkMonk | CC BY 3.0 |
| [Beach in Byblos](https://commons.wikimedia.org/wiki/File:Beach_in_Byblos.JPG) | Marcopolisnet | CC BY-SA 3.0 |
| [Batroun - Old Street (2308265587)](https://commons.wikimedia.org/wiki/File:Batroun_-_Old_Street_(2308265587).jpg) | Serge Melki | CC BY 2.0 |
| [Arches and the natural sea wall of the old city (2308265699)](https://commons.wikimedia.org/wiki/File:Arches_and_the_natural_sea_wall_of_the_old_city_(2308265699).jpg) | Serge Melki | CC BY 2.0 |
| ['Sour' dough (5348283264)](https://commons.wikimedia.org/wiki/File:'Sour'_dough_(5348283264).jpg) | Varun Shiv Kapur | CC BY 2.0 |
| [Streets of Sidon, Lebanon](https://commons.wikimedia.org/wiki/File:Streets_of_Sidon,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Old city of Sidon, Lebanon](https://commons.wikimedia.org/wiki/File:Old_city_of_Sidon,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [City Road 01](https://commons.wikimedia.org/wiki/File:City_Road_01.JPG) | Matze187 | CC BY-SA 3.0 |
| [TyreNarrowStChrQrt](https://commons.wikimedia.org/wiki/File:TyreNarrowStChrQrt.jpg) | Heretiq | CC BY-SA 2.5 |
| [Berdawnicafe](https://commons.wikimedia.org/wiki/File:Berdawnicafe.jpg) | Linaduliban | CC BY 3.0 |
| [Zahle,Lebanon](https://commons.wikimedia.org/wiki/File:Zahle,Lebanon.JPG) | Nassif.seif | Public domain |
| [3 elevators](https://commons.wikimedia.org/wiki/File:3_elevators.jpg) | Atomicdragon136 | CC BY 3.0 |
| [Entrance with ramp (5866504842)](https://commons.wikimedia.org/wiki/File:Entrance_with_ramp_(5866504842).jpg) | SuSanA Secretariat | CC BY 2.0 |
| [Accessible entrance at UCMS](https://commons.wikimedia.org/wiki/File:Accessible_entrance_at_UCMS.jpg) | Dr Satendra | CC BY-SA 3.0 |
| [Disabled Parking Space in Málaga](https://commons.wikimedia.org/wiki/File:Disabled_Parking_Space_in_M%C3%A1laga.jpg) | Daniel Capilla | CC BY-SA 4.0 |
| [Handicap toilet 2](https://commons.wikimedia.org/wiki/File:Handicap_toilet_2.jpg) | Tiia Monto | CC BY-SA 4.0 |
| [Bibliotheque Saint-Sulpice 12](https://commons.wikimedia.org/wiki/File:Bibliotheque_Saint-Sulpice_12.JPG) | Jeangagnon | CC BY-SA 4.0 |
| [Disabled Parking in Gibralfaro](https://commons.wikimedia.org/wiki/File:Disabled_Parking_in_Gibralfaro.jpg) | Daniel Capilla | CC BY-SA 4.0 |
| [Access Ramp 1](https://commons.wikimedia.org/wiki/File:Access_Ramp_1.JPG) | jsg1224 | CC BY-SA 3.0 |
| [An old dorway with steps - geograph.org.uk - 254063](https://commons.wikimedia.org/wiki/File:An_old_dorway_with_steps_-_geograph.org.uk_-_254063.jpg) | Stanley Howe | CC BY-SA 2.0 |
| [Abraham J. Friedlander House, Cincinnati, OH (46438201195)](https://commons.wikimedia.org/wiki/File:Abraham_J._Friedlander_House,_Cincinnati,_OH_(46438201195).jpg) | Warren LeMay | CC0 |
| [Accès pour handicapés 01](https://commons.wikimedia.org/wiki/File:Acc%C3%A8s_pour_handicap%C3%A9s_01.jpg) | Kondah | CC BY-SA 4.0 |
| [Ataman's district building (entrance)](https://commons.wikimedia.org/wiki/File:Ataman's_district_building_(entrance).jpg) | Alexander Roumega | CC BY-SA 4.0 |
| [Accessible toilet](https://commons.wikimedia.org/wiki/File:Accessible_toilet.jpg) | Tiia Monto | CC BY-SA 3.0 |
| [Analysing elevator control buttons (7771545062)](https://commons.wikimedia.org/wiki/File:Analysing_elevator_control_buttons_(7771545062).jpg) | Karen Mardahl | CC BY-SA 2.0 |
| [Accessible toilet in Japan](https://commons.wikimedia.org/wiki/File:Accessible_toilet_in_Japan.JPG) | Sara.szoke | CC BY-SA 4.0 |
| [Disabled Parking Spaces in Seminario](https://commons.wikimedia.org/wiki/File:Disabled_Parking_Spaces_in_Seminario.jpg) | Daniel Capilla | CC BY-SA 4.0 |

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

Render gives the port in `PORT`, the server reads it. Check: `https://<api>.onrender.com/api/health` answers `{"status":"ok"}`. The free plan sleeps when nobody uses it, so the first request can take about 30 seconds.

**Vercel** (connected to this repo):

| Field | Value |
|---|---|
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_API_URL` (the Render URL, no `/` at the end), `VITE_MAPTILER_KEY`, `VITE_MAPTILER_MAP`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` |

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

## Tests

```bash
cd server && npm test   # API: 401, 400, 404, helmet headers (no database needed)
cd client && npm test   # components: PlaceForm, Stars
```

Both use Vitest. The server tests import `app.js` with supertest, so they need no port and no database.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request (session 23): a clean GitHub machine installs the server and the client with `npm ci`, runs `npm test` in both, and builds the client. A red check on GitHub means something is broken before it reaches Render or Vercel. On Render, Auto-Deploy is set to "After CI checks pass", so a failing commit is never deployed.

## Security

Passwords are hashed with bcrypt, every private route needs a token, and every edit or delete is filtered by the owner (`req.userId`), so nobody can touch someone else's place, review, listing or request. The API also uses helmet, rate limits on login, zod validation and `sanitizeFilter`. The details, attack by attack, are in [SECURITY.md](SECURITY.md).

## Common problems

| Problem | Fix |
|---|---|
| `DB connection failed` … timeout | allow your IP in Atlas → Network Access |
| `Missing env var: …` when the server starts | that variable is missing in `server/.env` |
| `429 Too many attempts` at login | 5 tries per 15 minutes; wait, or restart the server while developing |
| CORS error in the browser console | `CLIENT_ORIGIN` must be exactly `http://localhost:5173`, no `/` at the end |
| Requests go to `undefined/api/...` | `VITE_API_URL` is missing in `client/.env`, then restart `npm run dev` |
| "Address not found on the map" | write a fuller address, e.g. `Rue Monot, Beirut` |
