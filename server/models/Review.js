import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 1 to 5 stars, like Google Maps
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: '' },
    // Cloudinary link, empty if no photo
    photoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
