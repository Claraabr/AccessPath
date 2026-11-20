import express from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Place } from '../models/Place.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const reviewsRouter = express.Router();

// PATCH /api/reviews/:id -> the author edits its own review
reviewsRouter.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const updates = {};
  for (const key of ['rating', 'comment', 'photoUrl']) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  try {
    const review = await Review.findOneAndUpdate(
      { _id: id, userId: req.userId }, // someone else's review -> 404
      updates,
      { new: true, runValidators: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id -> the author deletes its own review
reviewsRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const review = await Review.findOneAndDelete({ _id: id, userId: req.userId });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.status(204).end();
});

// A review of a place owned by the logged-in venue, or null
async function findReviewOfMyPlace(id, userId) {
  const review = await Review.findById(id);
  if (!review) return null;
  const place = await Place.findOne({ _id: review.placeId, ownerId: userId }); // "is it your place?"
  return place ? review : null;
}

// PUT /api/reviews/:id/reply -> the venue writes or changes its reply to a review of its place
reviewsRouter.put('/:id/reply', requireAuth, requireRole('venue'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'Write a reply first' });
  const review = await findReviewOfMyPlace(id, req.userId);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  review.reply = text;
  review.repliedAt = new Date();
  try {
    await review.save(); // checks the 500 characters
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id/reply -> the venue removes its reply
reviewsRouter.delete('/:id/reply', requireAuth, requireRole('venue'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const review = await findReviewOfMyPlace(id, req.userId);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  review.reply = '';
  review.repliedAt = undefined;
  await review.save();
  res.status(204).end();
});

export default reviewsRouter;
