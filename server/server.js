import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

// Missing secret? Stop right away instead of failing on the first login (session 21)
for (const key of ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN']) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

const port = Number(process.env.PORT) || 3000;

// Connect to MongoDB first, then start listening
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');
  app.listen(port, () => console.log(`API listening on :${port}`));
} catch (err) {
  console.error('DB connection failed:', err.message);
  process.exit(1);
}
