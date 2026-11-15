import express from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { requireAuth } from '../middleware/requireAuth.js';

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

export default reviewsRouter;
