import express from 'express';
import mongoose from 'mongoose';
import { Listing } from '../models/Listing.js';
import { Request } from '../models/Request.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const listingsRouter = express.Router();
const EDITABLE = ['title', 'type', 'mode', 'price', 'area', 'photoUrl'];

// GET /api/listings?type=ramp&mode=rent&area=beirut -> public
listingsRouter.get('/', async (req, res) => {
  const { type, mode, area } = req.query;
  // Only plain strings, never an array or an object
  for (const value of [type, mode, area]) {
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }
  }
  const filter = {};
  if (type) filter.type = type;
  if (mode) filter.mode = mode;
  // trusted(): this $regex is written by us, so sanitizeFilter lets it through
  if (area) filter.area = mongoose.trusted({ $regex: escapeRegex(area.slice(0, 100)), $options: 'i' });
  res.json(await Listing.find(filter).sort({ createdAt: -1 }));
});

// GET /api/listings/mine -> the listings of the logged-in supplier
listingsRouter.get('/mine', requireAuth, requireRole('supplier'), async (req, res) => {
  res.json(await Listing.find({ ownerId: req.userId }).sort({ createdAt: -1 }));
});

// GET /api/listings/:id -> one listing, with the supplier name and email to contact
listingsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const listing = await Listing.findById(id).populate('ownerId', 'name email');
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

// POST /api/listings -> a supplier posts equipment
listingsRouter.post('/', requireAuth, requireRole('supplier'), async (req, res) => {
  const data = { ownerId: req.userId }; // owner from the token
  for (const key of EDITABLE) data[key] = req.body[key];
  try {
    res.status(201).json(await Listing.create(data));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/listings/:id -> only the owner
listingsRouter.patch('/:id', requireAuth, requireRole('supplier'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const updates = {};
  for (const key of EDITABLE) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: id, ownerId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/listings/:id -> only the owner; its requests go with it
listingsRouter.delete('/:id', requireAuth, requireRole('supplier'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const listing = await Listing.findOneAndDelete({ _id: id, ownerId: req.userId });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  await Request.deleteMany({ listingId: id });
  res.status(204).end();
});

// POST /api/listings/:id/requests -> a user or a venue asks to rent or buy
// (a venue can rent a ramp to become accessible)
listingsRouter.post('/:id/requests', requireAuth, requireRole('user', 'venue'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (!(await Listing.findById(id))) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  // One open request per person/venue and listing
  if (await Request.findOne({ listingId: id, seekerId: req.userId, status: 'pending' })) {
    return res.status(409).json({ error: 'You already have a pending request for this listing' });
  }
  try {
    const request = await Request.create({
      listingId: id,
      seekerId: req.userId,
      message: req.body.message,
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default listingsRouter;
