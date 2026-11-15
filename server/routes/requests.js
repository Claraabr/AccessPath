import express from 'express';
import mongoose from 'mongoose';
import { Request } from '../models/Request.js';
import { Listing } from '../models/Listing.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const requestsRouter = express.Router();

// GET /api/requests/sent -> the requests the logged-in user or venue sent
requestsRouter.get('/sent', requireAuth, async (req, res) => {
  const requests = await Request.find({ seekerId: req.userId })
    .sort({ createdAt: -1 })
    .populate('listingId', 'title mode price');
  res.json(requests);
});

// GET /api/requests/received -> the requests on the logged-in supplier's listings
requestsRouter.get('/received', requireAuth, requireRole('supplier'), async (req, res) => {
  const myListings = await Listing.find({ ownerId: req.userId });
  const ids = myListings.map((l) => l._id);
  // trusted(): our own $in, sanitizeFilter would block it otherwise
  const requests = await Request.find({ listingId: mongoose.trusted({ $in: ids }) })
    .sort({ createdAt: -1 })
    .populate('listingId', 'title mode price')
    .populate('seekerId', 'name email');
  res.json(requests);
});

// PATCH /api/requests/:id -> the supplier answers: accepted or declined
requestsRouter.patch('/:id', requireAuth, requireRole('supplier'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { status } = req.body;
  if (status !== 'accepted' && status !== 'declined') {
    return res.status(400).json({ error: 'Status must be accepted or declined' });
  }
  const request = await Request.findById(id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  // Is the listing behind this request yours?
  const listing = await Listing.findOne({ _id: request.listingId, ownerId: req.userId });
  if (!listing) return res.status(404).json({ error: 'Request not found' });
  request.status = status;
  await request.save();
  res.json(request);
});

// DELETE /api/requests/:id -> the sender cancels a request that is still pending
requestsRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const request = await Request.findOneAndDelete({
    _id: id,
    seekerId: req.userId,
    status: 'pending',
  });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.status(204).end();
});

export default requestsRouter;
