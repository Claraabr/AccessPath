import mongoose from 'mongoose';

export const PLACE_CATEGORIES = [
  'restaurant', 'cafe', 'shop', 'pharmacy', 'hospital',
  'bank', 'university', 'government', 'other',
];

const placeSchema = new mongoose.Schema(
  {
    // The venue account that owns this place
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: PLACE_CATEGORIES },
    address: { type: String, required: true, trim: true },
    // Filled automatically from the address with Nominatim
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    // Accessibility criteria, declared by the place itself
    stepFree: { type: Boolean, default: false },
    elevator: { type: Boolean, default: false },
    toilets: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    // Photos of the place (Cloudinary links), the first one is the cover
    photos: {
      type: [String],
      default: [],
      validate: [(list) => list.length <= 10, 'A place can have 10 photos at most'],
    },
  },
  { timestamps: true }
);

export const Place = mongoose.model('Place', placeSchema);
