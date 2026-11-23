# AccessPath

**Live app:** https://access-path-brown.vercel.app

**API:** https://accesspath-api-0yy7.onrender.com (health check: [/api/health](https://accesspath-api-0yy7.onrender.com/api/health))

The API runs on Render's free plan and sleeps when nobody uses it: the first request after a while can take about 50 seconds.

AccessPath helps people with reduced mobility in Lebanon check whether a place is accessible before they go: a wheelchair user, a parent with a stroller, a grandparent with a cane, someone on crutches.

- **AccessPath** – places (cafes, hotels, shops, pharmacies…) declare their accessibility (step-free entrance, elevator, accessible toilets, parking), with a photo of each. Visitors leave reviews with a rating, a comment and a photo, so everyone can check if the place tells the truth. "Near me" uses the position of the phone to show the closest places first.
- **AccessFix** – a small marketplace where equipment suppliers rent or sell ramps, wheelchairs and other equipment. People and places can send a request, and "Near me" shows the closest suppliers first. A place with no step-free entrance or no elevator sees, on its own page, the ramps or stair climbers closest to it.

Capstone project for 020WBPES3 – Web Programming (ESIB, USJ).
Team: Clara Abou Rjeily (230718), Denise Aboukhater (240810).

## Accounts and roles

You choose your role when you sign up.

| Role | Who | Can |
|---|---|---|
| `user` | a person with reduced mobility, or someone who helps one | search places, write reviews, rent or buy equipment for themselves |
| `venue` | a business (restaurant, hotel, supermarket…) | one account = one place: set it up with photos, declare its accessibility, read and answer its reviews, update it when something changes, request equipment for the place |
| `supplier` | a business that rents or sells equipment | post listings (ramps, wheelchairs…), accept or decline requests from people and businesses |

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
├── client/                  # React app (Vite)
│   ├── src/
│   │   ├── api/             # client.js (apiFetch), upload.js (Cloudinary)
│   │   ├── auth/            # AuthContext.jsx (who is logged in)
│   │   ├── components/      # forms, map, badges…
│   │   ├── hooks/           # useApi.js
│   │   ├── pages/           # one file per screen
│   │   └── App.jsx          # the routes (React Router), one URL per page
│   └── .env.example
├── server/                  # Express API
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
| `Place` | name, category, address, lat, lng, stepFree, elevator, toilets, parking, photos (10 max), accessPhotos (one photo per criterion) | `ownerId` → User (a venue, one place each) |
| `Review` | rating (1–5), comment, photoUrl, reply and repliedAt (the answer of the owner) | `placeId` → Place, `userId` → User (one review per user and place) |
| `Listing` | title, type (ramp, wheelchair…), mode (`rent` / `sale`), price, area, photoUrl, lat, lng (found from the area) | `ownerId` → User (a supplier) |
| `Request` | message, status (`pending` / `accepted` / `declined`) | `listingId` → Listing, `seekerId` → User (a user or a venue) |

Deleting a place deletes its reviews; deleting a listing deletes its requests.

## Pages

Each role has its own home page and menu. On a computer the menu is a thin column of icons that opens when you move the mouse on it. A URL that is not for your role sends you back to your home page.

| URL | user | venue | supplier |
|---|---|---|---|
| `/` | "Welcome back", then search places (map + list, Near me) | "Welcome back", then my place as visitors see it, with Edit (photos, details, criteria) and AccessFix equipment for what is missing | "Welcome back", then my listings: post, edit, delete |
| `/places/:id` | a place, its criteria with their photos, its other photos and reviews; write / edit / delete my review | – | – |
| `/accessfix` | search equipment, Near me | search equipment, Near me | – |
| `/accessfix/:id` | a listing, ask to rent or buy | a listing, ask to rent or buy | – |
| `/my-reviews` | – | the reviews of my place: reply, edit or delete my reply, see the ones waiting | – |
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
# → Local: the address of the client (port 5173)
```

Open the address Vite shows, sign up and try it. To see every feature, create one account of each role: a `venue` adds a place, a `user` reviews it, a `supplier` posts a ramp, then the venue or the user requests it.

### 5. Demo data (optional)

```bash
cd server
node scripts/seed.js
```

This adds 71 places in 24 towns of Lebanon, from Tripoli, Halba, Ehden and Bsharri in the north to Saida, Jezzine and Tyre in the south, with Beirut, Mount Lebanon and the Bekaa in between: hotels, supermarkets, restaurants, cafes, shops, pharmacies, banks, hospitals, universities, public offices and a library, each with its accessibility, a cover photo and a photo of one of its criteria. Every category has places with each criterion, so a search like "cafe with an elevator" gives results. It also adds 9 visitors who left 199 reviews (2 to 5 per place, some with a reply of the owner), 6 equipment suppliers with 25 listings from Tripoli to Saida (each with a photo and a position for "Near me"), and 12 requests: people who need equipment for themselves or a relative, and businesses that need it for their place. The business names are made up, so no real business gets fake reviews, but the towns and the photos are real. Every demo account uses the password `demo1234`:

| Role | Email |
|---|---|
| user | `vasken-sarkis@demo.accesspath.lb` |
| venue | `vasken-s-bakery@demo.accesspath.lb` |
| supplier | `mobility-vs@demo.accesspath.lb` |

Running it again replaces the old demo data instead of adding it twice. To fill the online database, run it with the Atlas string: `MONGODB_URI="mongodb+srv://..." node scripts/seed.js`.

Each place has a photo of its street and a photo of what matters for access (the ramp or the steps at the door, the elevator, the toilets or the parking), shown next to that criterion on the place page. No photo is used twice. They all come from Wikimedia Commons:

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
| [Gemmayzeh (4694185351)](https://commons.wikimedia.org/wiki/File:Gemmayzeh_(4694185351).jpg) | Francisco Anzola | CC BY 2.0 |
| [Beirut Bourj Hammoud - 2018 - 12](https://commons.wikimedia.org/wiki/File:Beirut_Bourj_Hammoud_-_2018_-_12.jpg) | Daieuxetdailleurs | CC BY-SA 4.0 |
| [Beirut Bourj Hammoud - 2018 - 07](https://commons.wikimedia.org/wiki/File:Beirut_Bourj_Hammoud_-_2018_-_07.jpg) | Daieuxetdailleurs | CC BY-SA 4.0 |
| [Beirut Bourj Hammoud - 2018 - 10](https://commons.wikimedia.org/wiki/File:Beirut_Bourj_Hammoud_-_2018_-_10.jpg) | Daieuxetdailleurs | CC BY-SA 4.0 |
| [Sioufi Garden Achrafieh District 01](https://commons.wikimedia.org/wiki/File:Sioufi_Garden_Achrafieh_District_01.jpg) | Patrice Bon | CC0 |
| [Zahrat al Ihsan Street, Achrafieh, Beirut](https://commons.wikimedia.org/wiki/File:Zahrat_al_Ihsan_Street,_Achrafieh,_Beirut.jpg) | James Bradbury | CC BY-SA 4.0 |
| [Rue Hamra Sign](https://commons.wikimedia.org/wiki/File:Rue_Hamra_Sign.jpg) | Aza161 | CC BY-SA 4.0 |
| [Verdun beirut](https://commons.wikimedia.org/wiki/File:Verdun_beirut.jpg) | A.K.Khalifeh | CC BY-SA 3.0 |
| [Achrafieh](https://commons.wikimedia.org/wiki/File:Achrafieh.jpg) | Lebnen18 | CC BY-SA 3.0 |
| [Broumana From Hazmieh, Lebanon](https://commons.wikimedia.org/wiki/File:Broumana_From_Hazmieh,_Lebanon.jpg) | Paul Saad | CC BY-SA 4.0 |
| [Beit Meri - Grapevine on Balcony (2318594652)](https://commons.wikimedia.org/wiki/File:Beit_Meri_-_Grapevine_on_Balcony_(2318594652).jpg) | Serge Melki | CC BY 2.0 |
| [Aley Lebanon Houses and hillside](https://commons.wikimedia.org/wiki/File:Aley_Lebanon_Houses_and_hillside.jpg) | Peripitus | CC BY-SA 3.0 |
| [Deir El-Qamar 02](https://commons.wikimedia.org/wiki/File:Deir_El-Qamar_02.jpg) | Patrice Bon | CC0 |
| [Antelias Mar Elias](https://commons.wikimedia.org/wiki/File:Antelias_Mar_Elias.JPG) | Karapet Rubinyan (Lastak) | CC BY-SA 3.0 |
| [Jounieh 2](https://commons.wikimedia.org/wiki/File:Jounieh_2.jpg) | PublicSelfie | CC BY-SA 4.0 |
| [The village of faraya](https://commons.wikimedia.org/wiki/File:The_village_of_faraya.jpg) | Potatoes8895 | CC BY-SA 3.0 |
| [ByblosOldSouk](https://commons.wikimedia.org/wiki/File:ByblosOldSouk.jpg) | Elgaard | CC BY-SA 3.0 |
| [ByblosSoukNight](https://commons.wikimedia.org/wiki/File:ByblosSoukNight.jpg) | Elgaard | CC BY-SA 3.0 |
| [Batroun port IMG 1038](https://commons.wikimedia.org/wiki/File:Batroun_port_IMG_1038.jpg) | Amalmc | CC BY-SA 3.0 |
| [Historical districts, streets of Tripoli, Lebanon](https://commons.wikimedia.org/wiki/File:Historical_districts,_streets_of_Tripoli,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Downtown Tripoli, old buildings, Tripoli, Lebanon](https://commons.wikimedia.org/wiki/File:Downtown_Tripoli,_old_buildings,_Tripoli,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [La route principale à Zghorta](https://commons.wikimedia.org/wiki/File:La_route_principale_%C3%A0_Zghorta.jpg) | Canaïma | CC BY-SA 4.0 |
| [Vue de Ehden et du Mont-Liban](https://commons.wikimedia.org/wiki/File:Vue_de_Ehden_et_du_Mont-Liban.JPG) | Canaïma | CC BY-SA 4.0 |
| [Bsharri church and main square with a statue of angel, Bsharri, Lebanon](https://commons.wikimedia.org/wiki/File:Bsharri_church_and_main_square_with_a_statue_of_angel,_Bsharri,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Anjar Street, March 2017](https://commons.wikimedia.org/wiki/File:Anjar_Street,_March_2017.jpg) | Bdx | CC BY-SA 4.0 |
| [Temple of Jupiter, Baalbek, Lebanon (5073942385)](https://commons.wikimedia.org/wiki/File:Temple_of_Jupiter,_Baalbek,_Lebanon_(5073942385).jpg) | yeowatzup | CC BY 2.0 |
| [Rashaya](https://commons.wikimedia.org/wiki/File:Rashaya.jpg) | Hardscarf | CC BY-SA 4.0 |
| [Sidon Sea Castle, Sidon, Lebanon](https://commons.wikimedia.org/wiki/File:Sidon_Sea_Castle,_Sidon,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Alleyways, Old city of Sidon, Lebanon](https://commons.wikimedia.org/wiki/File:Alleyways,_Old_city_of_Sidon,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Jezzine 3](https://commons.wikimedia.org/wiki/File:Jezzine_3.JPG) | Freedom's Falcon | CC BY-SA 3.0 |
| [Remains of ancient columns at Al Mina excavation site, Tyre, Lebanon](https://commons.wikimedia.org/wiki/File:Remains_of_ancient_columns_at_Al_Mina_excavation_site,_Tyre,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Zaitunay Bay (1)](https://commons.wikimedia.org/wiki/File:Zaitunay_Bay_(1).jpg) | Radosław Botev | CC BY 3.0 PL |
| [Beirut 002](https://commons.wikimedia.org/wiki/File:Beirut_002.jpg) | James Gallagher | CC BY-SA 2.0 |
| [Badaro nightlife](https://commons.wikimedia.org/wiki/File:Badaro_nightlife.jpeg) | Imageuploader2 | CC BY-SA 4.0 |
| [Corniche Beirut at sunset, seaside promenade, Beirut, Lebanon](https://commons.wikimedia.org/wiki/File:Corniche_Beirut_at_sunset,_seaside_promenade,_Beirut,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [The Corniche Beirut, Beirut, Lebanon](https://commons.wikimedia.org/wiki/File:The_Corniche_Beirut,_Beirut,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Downtown Beirut](https://commons.wikimedia.org/wiki/File:Downtown_Beirut.jpg) | Brian Dell | Public domain |
| [Passing Beirut](https://commons.wikimedia.org/wiki/File:Passing_Beirut.jpg) | James Whatley | CC BY 2.0 |
| [Ras Beirut District (3)](https://commons.wikimedia.org/wiki/File:Ras_Beirut_District_(3).jpg) | Radosław Botev | CC BY 3.0 PL |
| [Rue Monot](https://commons.wikimedia.org/wiki/File:Rue_Monot.jpg) | Evilscaught | CC BY-SA 4.0 |
| [Beirut Corniche from University Tower](https://commons.wikimedia.org/wiki/File:Beirut_Corniche_from_University_Tower.jpg) | Wusel007 | CC BY-SA 3.0 |
| [Beirut Central District, Beirut, Lebanon - panoramio](https://commons.wikimedia.org/wiki/File:Beirut_Central_District,_Beirut,_Lebanon_-_panoramio.jpg) | ansam61 | CC BY 3.0 |
| [BeirutCentralDistrict](https://commons.wikimedia.org/wiki/File:BeirutCentralDistrict.jpg) | Lebnen18 | CC BY-SA 3.0 |
| [Beirut skyline](https://commons.wikimedia.org/wiki/File:Beirut_skyline.jpg) | Laura C Ellis | CC BY-SA 4.0 |
| [Beirut skylines 2019](https://commons.wikimedia.org/wiki/File:Beirut_skylines_2019.jpg) | Laura C Ellis | CC BY-SA 4.0 |
| [Lebanon- Dbayeh Highway](https://commons.wikimedia.org/wiki/File:Lebanon-_Dbayeh_Highway.jpg) | Serge Melki | CC BY 2.0 |
| [The city of Byblos, Lebanon](https://commons.wikimedia.org/wiki/File:The_city_of_Byblos,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Byblos historic quarter, Byblos, Lebanon](https://commons.wikimedia.org/wiki/File:Byblos_historic_quarter,_Byblos,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [Byblos - Jbeil City (2308966694)](https://commons.wikimedia.org/wiki/File:Byblos_-_Jbeil_City_(2308966694).jpg) | Serge Melki | CC BY 2.0 |
| [Mina-Tripoli-1](https://commons.wikimedia.org/wiki/File:Mina-Tripoli-1.jpg) | Dina El Ahdab | CC BY-SA 4.0 |
| [ساحة بلدية حلبا](https://commons.wikimedia.org/wiki/File:%D8%B3%D8%A7%D8%AD%D8%A9_%D8%A8%D9%84%D8%AF%D9%8A%D8%A9_%D8%AD%D9%84%D8%A8%D8%A7.jpg) | Amjliban | CC BY-SA 4.0 |
| [وسط حلبا](https://commons.wikimedia.org/wiki/File:%D9%88%D8%B3%D8%B7_%D8%AD%D9%84%D8%A8%D8%A7.jpg) | جمهورية حلبا | CC BY-SA 4.0 |
| [Zahlé pano](https://commons.wikimedia.org/wiki/File:Zahl%C3%A9_pano.jpg) | Eusebius | CC BY 3.0 |
| [SidonNewCity](https://commons.wikimedia.org/wiki/File:SidonNewCity.jpg) | Heretiq | CC BY-SA 2.5 |
| [Old city, Sidon, Lebanon](https://commons.wikimedia.org/wiki/File:Old_city,_Sidon,_Lebanon.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| [3 elevators](https://commons.wikimedia.org/wiki/File:3_elevators.jpg) | Atomicdragon136 | CC BY 3.0 |
| [Entrance with ramp (5866504842)](https://commons.wikimedia.org/wiki/File:Entrance_with_ramp_(5866504842).jpg) | SuSanA Secretariat | CC BY 2.0 |
| [Door step mosaic - geograph.org.uk - 6847739](https://commons.wikimedia.org/wiki/File:Door_step_mosaic_-_geograph.org.uk_-_6847739.jpg) | Anthony Vosper | CC BY-SA 2.0 |
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
| [Lyttelton House Gallery, Priory Steps, Malvern - geograph.org.uk - 1305094](https://commons.wikimedia.org/wiki/File:Lyttelton_House_Gallery,_Priory_Steps,_Malvern_-_geograph.org.uk_-_1305094.jpg) | Bob Embleton | CC BY-SA 2.0 |
| [Wheelchair ramp sign ](https://commons.wikimedia.org/wiki/File:Wheelchair_ramp_sign_.jpg) | MarkBuckawicki | CC0 |
| [Old steps - geograph.org.uk - 415706](https://commons.wikimedia.org/wiki/File:Old_steps_-_geograph.org.uk_-_415706.jpg) | Alexander P Kapp | CC BY-SA 2.0 |
| [7-Eleven Dongji Store wheelchair ramp 20221020](https://commons.wikimedia.org/wiki/File:7-Eleven_Dongji_Store_wheelchair_ramp_20221020.jpg) | ThomasYehYeh | CC BY-SA 4.0 |
| [Accessible toilet Platform 10 Roma Street Station Brisbane P1110354](https://commons.wikimedia.org/wiki/File:Accessible_toilet_Platform_10_Roma_Street_Station_Brisbane_P1110354.jpg) | John Robert McPherson | CC BY-SA 4.0 |
| [Destination control elevator interior 2](https://commons.wikimedia.org/wiki/File:Destination_control_elevator_interior_2.jpg) | Edward Orde | CC BY-SA 4.0 |
| [SSF Main Library wheelchair ramp 1](https://commons.wikimedia.org/wiki/File:SSF_Main_Library_wheelchair_ramp_1.JPG) | BrokenSphere | CC BY-SA 3.0 |
| [Diagonal handicapped parking space (18463401242)](https://commons.wikimedia.org/wiki/File:Diagonal_handicapped_parking_space_(18463401242).jpg) | Eric Fischer | CC BY 2.0 |
| [Interior of a vintage Montgomery elevator with a modified controller](https://commons.wikimedia.org/wiki/File:Interior_of_a_vintage_Montgomery_elevator_with_a_modified_controller.jpg) | Baron Maddock | CC BY 4.0 |
| [Schindler 330A hydraulic elevator interior with cascading doors](https://commons.wikimedia.org/wiki/File:Schindler_330A_hydraulic_elevator_interior_with_cascading_doors.jpg) | Baron Maddock | CC BY 4.0 |
| [Accessible toiletblock with ramp and handrail (6253938166)](https://commons.wikimedia.org/wiki/File:Accessible_toiletblock_with_ramp_and_handrail_(6253938166).jpg) | SuSanA Secretariat | CC BY 2.0 |
| [Entrance ramp on Market Place, Candler Building (1912; renovated 1990), 101-125 Market Place, Baltimore, MD 21202](https://commons.wikimedia.org/wiki/File:Entrance_ramp_on_Market_Place,_Candler_Building_(1912%3B_renovated_1990),_101-125_Market_Place,_Baltimore,_MD_21202.jpg) | Baltimore Heritage | CC0 |
| [Entrance to Heatherslaw Mill Shop - geograph.org.uk - 1555460](https://commons.wikimedia.org/wiki/File:Entrance_to_Heatherslaw_Mill_Shop_-_geograph.org.uk_-_1555460.jpg) | David Hambidge | CC BY-SA 2.0 |
| [Disabled Parking Space in Virreina Neighbourhood](https://commons.wikimedia.org/wiki/File:Disabled_Parking_Space_in_Virreina_Neighbourhood.jpg) | Daniel Capilla | CC BY-SA 4.0 |
| [Disabled accessible toilet Haringey](https://commons.wikimedia.org/wiki/File:Disabled_accessible_toilet_Haringey.jpg) | Acabashi | CC BY-SA 4.0 |
| [Handicap Parking Space (32283094777)](https://commons.wikimedia.org/wiki/File:Handicap_Parking_Space_(32283094777).jpg) | Tony Webster | CC BY-SA 2.0 |
| [Steps at the entrance to Grand Central - geograph.org.uk - 4693180](https://commons.wikimedia.org/wiki/File:Steps_at_the_entrance_to_Grand_Central_-_geograph.org.uk_-_4693180.jpg) | Mat Fascione | CC BY-SA 2.0 |
| [Charlecote Park disabled toilet Warwickshire England](https://commons.wikimedia.org/wiki/File:Charlecote_Park_disabled_toilet_Warwickshire_England.jpg) | Acabashi | CC BY-SA 4.0 |
| [On-street parallel handicapped parking space (18521571846)](https://commons.wikimedia.org/wiki/File:On-street_parallel_handicapped_parking_space_(18521571846).jpg) | Eric Fischer | CC BY 2.0 |
| [Accessible entrance](https://commons.wikimedia.org/wiki/File:Accessible_entrance.jpg) | Dr Satendra | CC BY-SA 3.0 |
| [ThyssenKrupp wheelchair lift in Moscow 01](https://commons.wikimedia.org/wiki/File:ThyssenKrupp_wheelchair_lift_in_Moscow_01.jpg) | Stolbovsky | CC BY-SA 3.0 |
| [B5 Johor Street Market - Disabled Parking](https://commons.wikimedia.org/wiki/File:B5_Johor_Street_Market_-_Disabled_Parking.jpg) | Chongkian | CC BY-SA 4.0 |
| [Lift doors - geograph.org.uk - 5562733](https://commons.wikimedia.org/wiki/File:Lift_doors_-_geograph.org.uk_-_5562733.jpg) | Bob Harvey | CC BY-SA 2.0 |
| [Hull Maritime Museum New Wheelchair Ramp, Kingston upon Hull Jun24](https://commons.wikimedia.org/wiki/File:Hull_Maritime_Museum_New_Wheelchair_Ramp,_Kingston_upon_Hull_Jun24.jpg) | Hullian111 | CC BY-SA 4.0 |
| [Accessible toilet at Majiapu Station (20181231133605)](https://commons.wikimedia.org/wiki/File:Accessible_toilet_at_Majiapu_Station_(20181231133605).jpg) | N509FZ | CC BY-SA 4.0 |
| [Handicapped parking space outside of the Combi, Aschendorf (2017)](https://commons.wikimedia.org/wiki/File:Handicapped_parking_space_outside_of_the_Combi,_Aschendorf_(2017).jpg) | Donald Trung | CC BY-SA 4.0 |
| [Toilet for disabled people with wheelchairs](https://commons.wikimedia.org/wiki/File:Toilet_for_disabled_people_with_wheelchairs.jpg) | E4024 | CC BY-SA 4.0 |
| [Changing Places Accessible Toilet for Disabled Inclusion](https://commons.wikimedia.org/wiki/File:Changing_Places_Accessible_Toilet_for_Disabled_Inclusion.jpg) | Southend-on-Sea Borough Council | CC0 |
| [Handrails in the ramp for wheelchair users](https://commons.wikimedia.org/wiki/File:Handrails_in_the_ramp_for_wheelchair_users.jpg) | Tarasna0922 | CC BY-SA 4.0 |
| [Accessible toilet Brisbane Airport Domestic Terminal IMGP5513](https://commons.wikimedia.org/wiki/File:Accessible_toilet_Brisbane_Airport_Domestic_Terminal_IMGP5513.jpg) | John Robert McPherson | CC BY-SA 4.0 |
| [Steps, handrail and ramp, Gate No.2 - geograph.org.uk - 2613734](https://commons.wikimedia.org/wiki/File:Steps,_handrail_and_ramp,_Gate_No.2_-_geograph.org.uk_-_2613734.jpg) | Robin Stott | CC BY-SA 2.0 |
| [Hakata Bus Terminal the interior of the elevator passing through the 5th floor Hakata-eki-chūōgai Hakata-ku Fukuoka 20240806](https://commons.wikimedia.org/wiki/File:Hakata_Bus_Terminal_the_interior_of_the_elevator_passing_through_the_5th_floor_Hakata-eki-ch%C5%AB%C5%8Dgai_Hakata-ku_Fukuoka_20240806.jpg) | Hirho | CC BY-SA 4.0 |
| [Lift doors at Tyntesfield](https://commons.wikimedia.org/wiki/File:Lift_doors_at_Tyntesfield.jpg) | Rodw | CC BY-SA 4.0 |
| [Accessible toilet Cherry Street Sports Club 68 Cherry St Ballina NSW L1010056](https://commons.wikimedia.org/wiki/File:Accessible_toilet_Cherry_Street_Sports_Club_68_Cherry_St_Ballina_NSW_L1010056.jpg) | John Robert McPherson | CC BY-SA 4.0 |
| [Blue Disc Parking Area Markings Blue Paint](https://commons.wikimedia.org/wiki/File:Blue_Disc_Parking_Area_Markings_Blue_Paint.JPG) | Spsmiler | CC0 |
| [Interior of Panoramic VEK Elevator in Beton Brut Hotel (Anapa)](https://commons.wikimedia.org/wiki/File:Interior_of_Panoramic_VEK_Elevator_in_Beton_Brut_Hotel_(Anapa).jpg) | ООО ТД "Век" | CC BY-SA 4.0 |
| [Fukuoka Airport Domestic Passenger Terminal Bldg The elevators in the atrium Hakata-ku Fukuoka 20250304 152738](https://commons.wikimedia.org/wiki/File:Fukuoka_Airport_Domestic_Passenger_Terminal_Bldg_The_elevators_in_the_atrium_Hakata-ku_Fukuoka_20250304_152738.jpg) | Hirho | CC BY 4.0 |
| [A closer view of the accessible toilet on the VIA Rail](https://commons.wikimedia.org/wiki/File:A_closer_view_of_the_accessible_toilet_on_the_VIA_Rail.jpg) | Gogerr | CC BY-SA 4.0 |
| [Red lift doors on platform 1, Bridgend railway station - geograph.org.uk - 6707903](https://commons.wikimedia.org/wiki/File:Red_lift_doors_on_platform_1,_Bridgend_railway_station_-_geograph.org.uk_-_6707903.jpg) | Jaggery | CC BY-SA 2.0 |
| [Accessible toilet Platforms 2&3 Rocklea Railway Station, Brooke Street, Rocklea P1120352](https://commons.wikimedia.org/wiki/File:Accessible_toilet_Platforms_2%263_Rocklea_Railway_Station,_Brooke_Street,_Rocklea_P1120352.jpg) | John Robert McPherson | CC0 |
| [Elevators at point A2 - NÄL hospital 1](https://commons.wikimedia.org/wiki/File:Elevators_at_point_A2_-_N%C3%84L_hospital_1.jpg) | W.carter | CC0 |
| [RDW disabled parking sign, Veendam (2020) 01](https://commons.wikimedia.org/wiki/File:RDW_disabled_parking_sign,_Veendam_(2020)_01.jpg) | Donald Trung Quoc Don | CC BY-SA 4.0 |
| [Dover elevator passenger controls (3 floors)](https://commons.wikimedia.org/wiki/File:Dover_elevator_passenger_controls_(3_floors).jpg) | unknown | Public domain |
| [Lift doors, Port Talbot Parkway station - geograph.org.uk - 7728730](https://commons.wikimedia.org/wiki/File:Lift_doors,_Port_Talbot_Parkway_station_-_geograph.org.uk_-_7728730.jpg) | Jaggery | CC BY-SA 2.0 |
| [Wheelchair ramp up to the cathedral entrance, Coventry – start of the handrail - geograph.org.uk - 5028944](https://commons.wikimedia.org/wiki/File:Wheelchair_ramp_up_to_the_cathedral_entrance,_Coventry_%E2%80%93_start_of_the_handrail_-_geograph.org.uk_-_5028944.jpg) | Robin Stott | CC BY-SA 2.0 |
| [French Disabled Parking Space Sign](https://commons.wikimedia.org/wiki/File:French_Disabled_Parking_Space_Sign.jpg) | Seanbhean-chríonna-caite | CC0 |
| [Provisional disabled parking sign, Molenlaankwartier, Rotterdam (2021) 02](https://commons.wikimedia.org/wiki/File:Provisional_disabled_parking_sign,_Molenlaankwartier,_Rotterdam_(2021)_02.jpg) | Donald Trung Quoc Don | CC BY-SA 4.0 |
| [Accessible outdoor public toilet Botanic Gardens Aarhus](https://commons.wikimedia.org/wiki/File:Accessible_outdoor_public_toilet_Botanic_Gardens_Aarhus.jpg) | Ciara Ní Riain | CC BY-SA 4.0 |
| [Lift doors - geograph.org.uk - 7367152](https://commons.wikimedia.org/wiki/File:Lift_doors_-_geograph.org.uk_-_7367152.jpg) | Bob Harvey | CC BY-SA 2.0 |
| [Michelangelostraat disabled parking sign, Prinsenland, Rotterdam (2022) 01](https://commons.wikimedia.org/wiki/File:Michelangelostraat_disabled_parking_sign,_Prinsenland,_Rotterdam_(2022)_01.jpg) | Donald Trung Quoc Don | CC BY-SA 4.0 |
| [Accessible toilet in CR400BF-0503 (20170307102356)](https://commons.wikimedia.org/wiki/File:Accessible_toilet_in_CR400BF-0503_(20170307102356).jpg) | N509FZ | CC BY-SA 4.0 |
| [Elevator Call Button](https://commons.wikimedia.org/wiki/File:Elevator_Call_Button.jpg) | Dieselducy | CC BY-SA 3.0 |
| [Chrysler Central Elevator 2019-10-03 20-18](https://commons.wikimedia.org/wiki/File:Chrysler_Central_Elevator_2019-10-03_20-18.jpg) | Axel Tschentscher | CC BY-SA 4.0 |
| [Elevator at Vestfold Hospital 2](https://commons.wikimedia.org/wiki/File:Elevator_at_Vestfold_Hospital_2.jpg) | Peter Fiskerstrand | CC BY-SA 4.0 |
| [Disabled ramp to Caernarfon Castle - geograph.org.uk - 1280693](https://commons.wikimedia.org/wiki/File:Disabled_ramp_to_Caernarfon_Castle_-_geograph.org.uk_-_1280693.jpg) | Eirian Evans | CC BY-SA 2.0 |

The equipment photos of the AccessFix listings also come from Wikimedia Commons:

| Photo | Author | License |
|---|---|---|
| [Station worker with portable wheelchair ramp and wheelchair user - Tokyo - Akihabara stn Sep 20 2019 02-13PM](https://commons.wikimedia.org/wiki/File:Station_worker_with_portable_wheelchair_ramp_and_wheelchair_user_-_Tokyo_-_Akihabara_stn_Sep_20_2019_02-13PM.jpeg) | Nesnad | CC BY 4.0 |
| [Modular Wheelchair Ramp - Upside Innovations](https://commons.wikimedia.org/wiki/File:Modular_Wheelchair_Ramp_-_Upside_Innovations.jpg) | RampExpert | CC BY-SA 4.0 |
| [Temporary access ramp, Brisbane 01](https://commons.wikimedia.org/wiki/File:Temporary_access_ramp,_Brisbane_01.jpg) | John Robert McPherson | CC0 |
| [Medline F-1 manual wheelchair 1](https://commons.wikimedia.org/wiki/File:Medline_F-1_manual_wheelchair_1.JPG) | Stephen B Calvert | CC BY-SA 4.0 |
| [Blue folding lightweight wheelchair](https://commons.wikimedia.org/wiki/File:Blue_folding_lightweight_wheelchair.jpg) | Arnold C | CC BY 2.0 |
| [GUS7910](https://commons.wikimedia.org/wiki/File:GUS7910.jpg) | ElizavetaKot | CC BY-SA 4.0 |
| [Pride Jazzy Select power chair 001](https://commons.wikimedia.org/wiki/File:Pride_Jazzy_Select_power_chair_001.JPG) | Stephen B Calvert | CC BY-SA 3.0 |
| [Rollator 2](https://commons.wikimedia.org/wiki/File:Rollator_2.jpg) | Bestrossi | Public domain |
| [Walker. frame](https://commons.wikimedia.org/wiki/File:Walker._frame.jpg) | High Plains Drifter (English Wikipedia) | Public domain |
| [Foldable ramp Manchester Piccadilly Station](https://commons.wikimedia.org/wiki/File:Foldable_ramp_Manchester_Piccadilly_Station.jpg) | Auledas | CC BY-SA 4.0 |
| [Rollator-carbon](https://commons.wikimedia.org/wiki/File:Rollator-carbon.jpg) | Oksdfjkllrwe | CC BY-SA 4.0 |
| [Wheelchair and temporary train ramp in Tokyo 2019 5 25](https://commons.wikimedia.org/wiki/File:Wheelchair_and_temporary_train_ramp_in_Tokyo_2019_5_25.jpeg) | Nesnad | CC BY 4.0 |
| [Stryker Prime TC wheelchair](https://commons.wikimedia.org/wiki/File:Stryker_Prime_TC_wheelchair.jpg) | SuddenFrost | CC BY-SA 4.0 |
| [Rear ramp load of wheelchair, QDN Office, Hamilton Place Bowen Hills IMGP8391](https://commons.wikimedia.org/wiki/File:Rear_ramp_load_of_wheelchair,_QDN_Office,_Hamilton_Place_Bowen_Hills_IMGP8391.jpg) | John Robert McPherson | CC BY-SA 4.0 |
| [SOLD Shower chair, bath transfer bench, toilet riser (4861775529)](https://commons.wikimedia.org/wiki/File:SOLD_Shower_chair,_bath_transfer_bench,_toilet_riser_(4861775529).jpg) | The Living Room | CC BY 2.0 |
| [Grab bar](https://commons.wikimedia.org/wiki/File:Grab_bar.jpg) | Gramody | CC BY-SA 2.0 |
| [My rollator](https://commons.wikimedia.org/wiki/File:My_rollator.jpg) | Barbara Hobbs | CC BY 2.0 |
| [Axillary Crutches](https://commons.wikimedia.org/wiki/File:Axillary_Crutches.jpg) | Jessica Fisher | CC BY-SA 4.0 |
| [Transfer bench](https://commons.wikimedia.org/wiki/File:Transfer_bench.jpg) | Roger Mommaerts | CC BY-SA 2.0 |
| [Tag A5 Treppensteiger](https://commons.wikimedia.org/wiki/File:Tag_A5_Treppensteiger.jpg) | Klaus-Dieter Keller | CC BY-SA 3.0 |
| [Walker extended](https://commons.wikimedia.org/wiki/File:Walker_extended.JPG) | BrokenSphere | CC BY-SA 3.0 |
| [Age-friendly tools 3](https://commons.wikimedia.org/wiki/File:Age-friendly_tools_3.jpg) | Ashashyou | CC BY-SA 3.0 |
| [UNAwheel Mini Active wheelchair power add-on in Los Angeles](https://commons.wikimedia.org/wiki/File:UNAwheel_Mini_Active_wheelchair_power_add-on_in_Los_Angeles.jpg) | Nick Yudin | CC BY-SA 4.0 |
| [Winnie Walker EXP Steel Rollator 002 CR](https://commons.wikimedia.org/wiki/File:Winnie_Walker_EXP_Steel_Rollator_002_CR.JPG) | Stephen B Calvert | CC BY-SA 3.0 |
| [Escape-Chair on stair case](https://commons.wikimedia.org/wiki/File:Escape-Chair_on_stair_case.jpg) | Joep Cuijpers | CC BY-SA 4.0 |

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

## Tests

```bash
cd server && npm test   # API: 401, 400, 404, helmet headers, reply needs a token (no database needed)
cd client && npm test   # components: PlaceForm, Stars; distances for Near me
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
| CORS error in the browser console | `CLIENT_ORIGIN` must be exactly the address of the client, no `/` at the end |
| Requests go to `undefined/api/...` | `VITE_API_URL` is missing in `client/.env`, then restart `npm run dev` |
| "Address not found on the map" | write a fuller address, e.g. `Rue Monot, Beirut` |
