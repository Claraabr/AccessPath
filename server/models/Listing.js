import mongoose from 'mongoose';
import { photoUrlRule } from '../utils/isPhotoUrl.js';

export const EQUIPMENT_TYPES = ['ramp', 'wheelchair', 'stair-climber', 'walker', 'other'];

const listingSchema = new mongoose.Schema(
  {
    // The supplier that posted the listing
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, required: true, enum: EQUIPMENT_TYPES },
    mode: { type: String, required: true, enum: ['rent', 'sale'] },
    price: { type: Number, required: true, min: 0 },
    area: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: '', validate: photoUrlRule },
    // Position of the area, found with Nominatim, for "Near me". Empty if the area was not found
    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);
