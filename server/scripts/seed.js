// Demo data, so the map and the lists are not empty during the demo:
// 16 places in 8 towns of Lebanon (each one with its own venue account and 2 photos),
// 4 visitors who leave reviews, 3 equipment suppliers with 14 listings, and a few requests.
// The business names are made up on purpose (no fake reviews about real businesses),
// but the towns and the street photos are real.
// Photos: Wikimedia Commons, free licenses, credits in the README. No photo is used twice.
//
// Every demo account has an email ending in @demo.accesspath.lb and the password demo1234.
// Running the script again first deletes the old demo data, so it never doubles.
//   on your computer:  node scripts/seed.js
//   on Atlas:          MONGODB_URI="mongodb+srv://..." node scripts/seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Place } from '../models/Place.js';
import { Review } from '../models/Review.js';
import { Listing } from '../models/Listing.js';
import { Request } from '../models/Request.js';

const DOMAIN = '@demo.accesspath.lb';
const PASSWORD = 'demo1234';

// Each place: name, category, address, lat, lng,
// its 4 criteria [step-free, elevator, toilets, parking],
// a photo of its street (the cover) and a photo of what matters for access
// (the ramp or the steps at the door, the elevator, the toilets or the parking).
const PLACES = [
  ['Hotel Cedar Bay', 'hotel', 'Ain el Mreisseh, Beirut', 33.9002, 35.4878,
    [true, true, true, true], 'Another rainy Beirut day.jpg', '3 elevators.jpg'],
  ['Hamra Fresh Market', 'supermarket', 'Hamra Street, Beirut', 33.8968, 35.483,
    [true, false, false, false], 'Hamra Street, Beirut (1).jpg', 'Entrance with ramp (5866504842).jpg'],
  ["Vasken's Bakery", 'restaurant', 'Armenia Street, Bourj Hammoud', 33.8925, 35.5425,
    [true, false, false, false], 'Beirut Bourj Hammoud - 2018 - 08.jpg', 'Accessible entrance at UCMS.jpg'],
  ['Sarkis Market', 'supermarket', 'Arax Street, Bourj Hammoud', 33.8908, 35.5397,
    [true, false, true, true], 'Beirut Bourj Hammoud - 2018 - 11.jpg', 'Disabled Parking Space in Málaga.jpg'],
  ['Jounieh Bay Hotel', 'hotel', 'Seaside road, Jounieh', 33.9808, 35.6178,
    [true, true, true, false], 'Bayofjouniehviewfromrabieh2.JPG', 'Handicap toilet 2.jpg'],
  ['Kaslik Shoe Gallery', 'shop', 'Kaslik, Jounieh', 33.9695, 35.6125,
    [false, false, false, false], '3133 (8)jounieh.JPG', 'Bibliotheque Saint-Sulpice 12.JPG'],
  ['Sea Gate Grill', 'restaurant', 'Seaside, Byblos', 34.121, 35.646,
    [true, false, true, true], 'Beach in Byblos.JPG', 'Disabled Parking in Gibralfaro.jpg'],
  ['Batroun Lemonade House', 'cafe', 'Old town, Batroun', 34.2553, 35.6588,
    [true, false, false, false], 'Batroun - Old Street (2308265587).jpg', 'Access Ramp 1.JPG'],
  ['Phoenician Wall Guesthouse', 'hotel', 'Seaside, Batroun', 34.2565, 35.6555,
    [false, false, false, false], 'Arches and the natural sea wall of the old city (2308265699).jpg',
    'An old dorway with steps - geograph.org.uk - 254063.jpg'],
  ['Tripoli Sweets Corner', 'restaurant', 'Old city, Tripoli', 34.4367, 35.8497,
    [false, false, false, true], "'Sour' dough (5348283264).jpg",
    'Abraham J. Friedlander House, Cincinnati, OH (46438201195).jpg'],
  ['Old Souk Pharmacy', 'pharmacy', 'Old city, Saida', 33.563, 35.37,
    [true, false, false, false], 'Streets of Sidon, Lebanon.jpg', 'Accès pour handicapés 01.jpg'],
  ['Old Saida Coffee House', 'cafe', 'Old city, Saida', 33.5628, 35.3712,
    [false, false, false, false], 'Old city of Sidon, Lebanon.jpg', "Ataman's district building (entrance).jpg"],
  ['Tyre Family Market', 'supermarket', 'Main road, Tyre', 33.2705, 35.196,
    [true, false, true, true], 'City Road 01.JPG', 'Accessible toilet.jpg'],
  ['Old Port Rooms', 'hotel', 'Christian quarter, Tyre', 33.2745, 35.1945,
    [true, true, true, false], 'TyreNarrowStChrQrt.jpg', 'Analysing elevator control buttons (7771545062).jpg'],
  ['Berdawni River Terrace', 'restaurant', 'Berdawni, Zahle', 33.853, 35.902,
    [true, false, true, true], 'Berdawnicafe.jpg', 'Accessible toilet in Japan.JPG'],
  ['Zahle Family Market', 'supermarket', 'Main street, Zahle', 33.8463, 35.902,
    [true, false, true, true], 'Zahle,Lebanon.JPG', 'Disabled Parking Spaces in Seminario.jpg'],
];

const commonsUrl = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`;

const VISITORS = ['Rana', 'Marc', 'Nour', 'Karim'];

// place index, visitor index, rating, comment
const REVIEWS = [
  [0, 0, 5, 'Ramp at the main door and a large elevator. The staff helped me with my bags without me asking.'],
  [0, 1, 4, 'Everything is accessible. The parking spots are a bit far from the entrance.'],
  [2, 0, 5, 'No step at the door and the best manakish in Bourj Hammoud. Ask for the cheese one.'],
  [2, 2, 4, 'Easy to get in with a stroller. Small inside, so it gets crowded at lunch time.'],
  [3, 1, 4, 'Wide aisles and an accessible toilet at the back. Parking right in front.'],
  [4, 3, 4, 'Elevator to every floor and a large accessible bathroom. No reserved parking, I parked in the street.'],
  [5, 2, 2, 'Two big steps at the door and nobody around to help. I could not get in with the wheelchair.'],
  [6, 1, 5, 'Flat entrance on the beach side, accessible toilet and parking. Perfect for my father.'],
  [7, 0, 4, 'A small ramp at the side door, the owner showed us. The old town streets around are uneven.'],
  [8, 3, 2, 'Beautiful view but steps everywhere, even to reach the rooms.'],
  [9, 2, 3, 'The sweets are amazing. Steps at the entrance, but they bring the order out to the car.'],
  [11, 0, 1, 'Lovely place but impossible in a wheelchair: steps at the door and a tiny toilet.'],
  [13, 1, 5, 'Small hotel but with an elevator and a large bathroom. Rare in the old city.'],
  [14, 3, 5, 'Flat terrace by the river, accessible toilet and parking. We go every summer with my grandmother.'],
];

// Several of each type, in and around Beirut, so every search gives results
const SUPPLIERS = ['Georges Medical Supply', 'Mobility Lebanon', 'Cedar Rehab Equipment'];
const LISTINGS = [
  [0, 'Portable ramp 2 m', 'ramp', 'rent', 25, 'Achrafieh, Beirut'],
  [0, 'Modular ramp 4 m', 'ramp', 'rent', 40, 'Achrafieh, Beirut'],
  [0, 'Threshold ramp for one step', 'ramp', 'sale', 35, 'Achrafieh, Beirut'],
  [0, 'Folding wheelchair', 'wheelchair', 'sale', 180, 'Achrafieh, Beirut'],
  [0, 'Wheelchair for a week', 'wheelchair', 'rent', 15, 'Achrafieh, Beirut'],
  [1, 'Stair climber for apartments', 'stair-climber', 'rent', 60, 'Hamra, Beirut'],
  [1, 'Electric wheelchair', 'wheelchair', 'rent', 45, 'Hamra, Beirut'],
  [1, 'Walker with seat', 'walker', 'sale', 45, 'Hamra, Beirut'],
  [1, 'Light walker', 'walker', 'rent', 8, 'Hamra, Beirut'],
  [1, 'Aluminium ramp 3 m', 'ramp', 'sale', 220, 'Hamra, Beirut'],
  [2, 'Folding ramp 1.5 m', 'ramp', 'rent', 20, 'Jounieh'],
  [2, 'Transport wheelchair', 'wheelchair', 'sale', 150, 'Jounieh'],
  [2, 'Shower chair', 'other', 'sale', 30, 'Jdeideh'],
  [2, 'Portable stair handrail', 'other', 'rent', 10, 'Jdeideh'],
];

// The email of a demo account: "Hotel Cedar Bay" -> hotel-cedar-bay@demo.accesspath.lb
function demoEmail(name) {
  const slug = name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug + DOMAIN;
}

await mongoose.connect(process.env.MONGODB_URI);

// 1. Remove the demo data of a previous run
const oldUsers = await User.find({ email: { $regex: 'demo\\.accesspath\\.lb$' } });
const oldIds = oldUsers.map((u) => u._id);
const oldPlaces = await Place.find({ ownerId: { $in: oldIds } });
const oldListings = await Listing.find({ ownerId: { $in: oldIds } });
await Review.deleteMany({ $or: [{ userId: { $in: oldIds } }, { placeId: { $in: oldPlaces.map((p) => p._id) } }] });
await Request.deleteMany({ $or: [{ seekerId: { $in: oldIds } }, { listingId: { $in: oldListings.map((l) => l._id) } }] });
await Listing.deleteMany({ ownerId: { $in: oldIds } });
await Place.deleteMany({ ownerId: { $in: oldIds } });
await User.deleteMany({ _id: { $in: oldIds } });

// 2. Accounts (one hash for everyone, it is the same password)
const passwordHash = await bcrypt.hash(PASSWORD, 12);
const makeUser = (name, role) => User.create({ name, email: demoEmail(name), passwordHash, role });

const places = [];
for (const [name, category, address, lat, lng, criteria, cover, accessPhoto] of PLACES) {
  const [stepFree, elevator, toilets, parking] = criteria;
  const owner = await makeUser(name, 'venue');
  places.push(await Place.create({
    ownerId: owner._id, name, category, address, lat, lng, stepFree, elevator, toilets, parking,
    photos: [commonsUrl(cover), commonsUrl(accessPhoto)],
  }));
}

const visitors = [];
for (const name of VISITORS) visitors.push(await makeUser(name, 'user'));

for (const [p, v, rating, comment] of REVIEWS) {
  await Review.create({ placeId: places[p]._id, userId: visitors[v]._id, rating, comment });
}

const suppliers = [];
for (const name of SUPPLIERS) suppliers.push(await makeUser(name, 'supplier'));

const listings = [];
for (const [s, title, type, mode, price, area] of LISTINGS) {
  listings.push(await Listing.create({ ownerId: suppliers[s]._id, title, type, mode, price, area }));
}

// 3. A few requests, so "My requests" and "Requests received" are not empty
await Request.create({
  listingId: listings[0]._id, seekerId: visitors[0]._id,
  message: 'For a wedding on Saturday in Broummana, can you deliver?',
});
await Request.create({
  listingId: listings[0]._id, seekerId: places[5].ownerId, status: 'accepted',
  message: 'We have two steps at the entrance, we would like to rent it for a month.',
});
await Request.create({
  listingId: listings[3]._id, seekerId: visitors[1]._id, status: 'declined',
  message: 'Is it still available?',
});

console.log(`${places.length} places, ${visitors.length} visitors, ${REVIEWS.length} reviews, ${listings.length} listings added`);
console.log(`Log in with any demo email (e.g. ${demoEmail('Rana')}) and the password ${PASSWORD}`);
await mongoose.disconnect();
