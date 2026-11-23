// Removes the accounts made by hand while testing: every account whose email does NOT
// end in @demo.accesspath.lb, with what they made (place, reviews, listings, requests)
// and the reviews and requests left on their place or listings.
// The demo data (seed.js) is not touched.
//
//   see what would be removed:  node scripts/remove-test-accounts.js
//   remove it:                  node scripts/remove-test-accounts.js --delete
//   on Atlas:                   MONGODB_URI=$MONGODB_URI node scripts/remove-test-accounts.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Place } from '../models/Place.js';
import { Review } from '../models/Review.js';
import { Listing } from '../models/Listing.js';
import { Request } from '../models/Request.js';

const really = process.argv.includes('--delete');

await mongoose.connect(process.env.MONGODB_URI);

const users = await User.find({ email: { $not: /@demo\.accesspath\.lb$/ } });
const ids = users.map((u) => u._id);
const places = await Place.find({ ownerId: { $in: ids } });
const listings = await Listing.find({ ownerId: { $in: ids } });

if (users.length === 0) {
  console.log('No test account: only the demo accounts are left.');
} else {
  console.log(`${users.length} test account(s):`);
  for (const u of users) {
    const place = places.find((p) => p.ownerId.equals(u._id));
    console.log(`- ${u.name} <${u.email}> (${u.role})${place ? `, place: ${place.name}` : ''}`);
  }
}

if (really && users.length > 0) {
  const placeIds = places.map((p) => p._id);
  const listingIds = listings.map((l) => l._id);
  await Review.deleteMany({ $or: [{ userId: { $in: ids } }, { placeId: { $in: placeIds } }] });
  await Request.deleteMany({ $or: [{ seekerId: { $in: ids } }, { listingId: { $in: listingIds } }] });
  await Listing.deleteMany({ ownerId: { $in: ids } });
  await Place.deleteMany({ ownerId: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  console.log('Removed.');
} else if (users.length > 0) {
  console.log('Nothing removed. Run it again with --delete to remove them.');
}

await mongoose.disconnect();
