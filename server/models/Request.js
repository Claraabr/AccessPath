import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    // The user or venue who asks to rent or buy
    seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true }
);

export const Request = mongoose.model('Request', requestSchema);
