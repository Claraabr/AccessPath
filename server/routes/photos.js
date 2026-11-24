import express from 'express';
import mongoose from 'mongoose';
import { Photo } from '../models/Photo.js';
import { requireAuth } from '../middleware/requireAuth.js';

const photosRouter = express.Router();
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// POST /api/photos -> any logged-in account can send a photo
// The body is the image itself, not JSON: express.raw reads it only for these 3 types, 2 MB max (413 above)
photosRouter.post('/', requireAuth, express.raw({ type: TYPES, limit: '2mb' }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: 'Send a JPEG, PNG or WebP photo' });
  }
  const photo = await Photo.create({ ownerId: req.userId, contentType: req.is(TYPES), data: req.body });
  // The full address, so it is saved like any other photo URL (in a place, a review or a listing)
  res.status(201).json({ url: `${req.protocol}://${req.get('host')}/api/photos/${photo._id}` });
});

// GET /api/photos/:id -> public, so <img src="..."> works
photosRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const photo = await Photo.findById(id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  res.set('Content-Type', photo.contentType);
  // A photo never changes: the browser can keep it for a year (session 22)
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  // Helmet only lets our own origin load what the API sends; the React app is on Vercel
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.send(photo.data);
});

export default photosRouter;
