// One-time script: the old "business" role was split into "venue" and "supplier".
// Old business accounts become venues; listings they owned are removed
// (a venue does not post listings anymore). Run once: node scripts/fix-roles.js
import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const oldBusinesses = await db.collection('users').find({ role: 'business' }).toArray();
const ids = oldBusinesses.map((u) => u._id);

const listings = await db.collection('listings').find({ ownerId: { $in: ids } }).toArray();
const listingIds = listings.map((l) => l._id);
await db.collection('requests').deleteMany({ listingId: { $in: listingIds } });
await db.collection('listings').deleteMany({ _id: { $in: listingIds } });
await db.collection('users').updateMany({ role: 'business' }, { $set: { role: 'venue' } });

console.log(`${ids.length} business account(s) are now venues, ${listingIds.length} listing(s) removed`);
await mongoose.disconnect();
