import mongoose from 'mongoose';

// A photo sent by a user, kept in MongoDB itself.
// (Cloudinary does not accept accounts from Lebanon, so the photos live in our own database.)
// The browser shrinks it to 1200 px before sending it, so a photo weighs a few hundred kB.
const photoSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp'] },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export const Photo = mongoose.model('Photo', photoSchema);
