import express from 'express';
import mongoose from 'mongoose';
import { Place } from '../models/Place.js';
import { Review } from '../models/Review.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { geocode } from '../utils/geocode.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const placesRouter = express.Router();
const CRITERIA = ['stepFree', 'elevator', 'toilets', 'parking'];

// GET /api/places?search=cafe&category=restaurant&criteria=stepFree,elevator
// Public: anyone can look for accessible places
placesRouter.get('/', async (req, res) => {
  const { search, category, criteria } = req.query;
  // ?search=a&search=b gives an array: only plain strings are accepted
  for (const value of [search, category, criteria]) {
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }
  }
  const filter = {};
  if (search) {
    // trusted(): this $regex is written by us, so sanitizeFilter lets it through
    filter.name = mongoose.trusted({ $regex: escapeRegex(search.slice(0, 100)), $options: 'i' });
  }
  if (category) {
    filter.category = category;
  }
  if (criteria) {
    // Every criterion asked for must be true
    for (const c of criteria.split(',')) {
      if (CRITERIA.includes(c)) filter[c] = true;
    }
  }
  res.json(await Place.find(filter).sort({ name: 1 }));
});

// GET /api/places/mine -> the place of the logged-in venue (one venue account = one place)
// (declared before /:id, otherwise Express would read "mine" as an id)
placesRouter.get('/mine', requireAuth, requireRole('venue'), async (req, res) => {
  // null if the venue has not set up its place yet
  res.json(await Place.findOne({ ownerId: req.userId }));
});

// GET /api/places/:id -> one place
placesRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const place = await Place.findById(id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json(place);
});

// POST /api/places -> a venue sets up its place and declares its criteria (only once)
placesRouter.post('/', requireAuth, requireRole('venue'), async (req, res) => {
  const { name, category, address } = req.body;
  if (await Place.findOne({ ownerId: req.userId })) {
    return res.status(409).json({ error: 'Your account already has a place, edit it instead' });
  }
  if (!address) return res.status(400).json({ error: 'Address is required' });
  const coords = await geocode(address);
  if (!coords) return res.status(400).json({ error: 'Address not found on the map' });
  try {
    const place = await Place.create({
      name,
      category,
      address,
      lat: coords.lat,
      lng: coords.lng,
      stepFree: Boolean(req.body.stepFree),
      elevator: Boolean(req.body.elevator),
      toilets: Boolean(req.body.toilets),
      parking: Boolean(req.body.parking),
      photos: req.body.photos,
      ownerId: req.userId, // owner comes from the token, never the body
    });
    res.status(201).json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/places/:id -> only the owner can change its place
placesRouter.patch('/:id', requireAuth, requireRole('venue'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  // Keep only the fields a venue is allowed to change
  const updates = {};
  for (const key of ['name', 'category', 'address', 'photos', ...CRITERIA]) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  // New address -> new coordinates
  if (updates.address) {
    const coords = await geocode(updates.address);
    if (!coords) return res.status(400).json({ error: 'Address not found on the map' });
    updates.lat = coords.lat;
    updates.lng = coords.lng;
  }
  try {
    const place = await Place.findOneAndUpdate(
      { _id: id, ownerId: req.userId }, // "is it yours?"
      updates,
      { new: true, runValidators: true }
    );
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/places/:id -> only the owner; its reviews go with it
placesRouter.delete('/:id', requireAuth, requireRole('venue'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const place = await Place.findOneAndDelete({ _id: id, ownerId: req.userId });
  if (!place) return res.status(404).json({ error: 'Place not found' });
  await Review.deleteMany({ placeId: id });
  res.status(204).end();
});

// GET /api/places/:id/reviews -> public, newest first, with the author's name
placesRouter.get('/:id/reviews', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const reviews = await Review.find({ placeId: id })
    .sort({ createdAt: -1 })
    .populate('userId', 'name');
  res.json(reviews);
});

// POST /api/places/:id/reviews -> a user (not a venue or supplier) reviews a place, once
placesRouter.post('/:id/reviews', requireAuth, requireRole('user'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (!(await Place.findById(id))) {
    return res.status(404).json({ error: 'Place not found' });
  }
  if (await Review.findOne({ placeId: id, userId: req.userId })) {
    return res.status(409).json({ error: 'You already reviewed this place' });
  }
  try {
    const review = await Review.create({
      placeId: id,
      userId: req.userId,
      rating: req.body.rating,
      comment: req.body.comment,
      photoUrl: req.body.photoUrl,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default placesRouter;
