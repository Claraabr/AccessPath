import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never the plain password, only the bcrypt hash (session 19)
    passwordHash: { type: String, required: true },
    // user     = a person looking for accessible places or equipment
    // venue    = a place (cafe, hotel, shop...) that declares its accessibility
    // supplier = a business that rents or sells accessibility equipment
    role: { type: String, enum: ['user', 'venue', 'supplier'], default: 'user' },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
