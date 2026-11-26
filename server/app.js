import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import placesRouter from './routes/places.js';
import reviewsRouter from './routes/reviews.js';
import listingsRouter from './routes/listings.js';
import requestsRouter from './routes/requests.js';
import photosRouter from './routes/photos.js';

// Turns { $ne: ... } and other operators sent by a client into plain values (session 21)
mongoose.set('sanitizeFilter', true);

// The app is in its own file so the tests can use it without a port or a database (session 22)
const app = express();

// Secure headers: CSP, HSTS, nosniff... and no X-Powered-By (session 21)
app.use(helmet());
// Let the React app (on another port) call this API
// CLIENT_ORIGIN can list several origins with commas: dev (5173) and preview (4173)
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') }));

// Rate limits: 1000 requests per 15 min for the whole API, 5 failed logins.
// A class often shares one IP, so a successful login does not count.
const apiLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 1000,
  message: { error: 'Too many requests. Try again later.' }, // JSON, like our other errors
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed attempts. Try again in 15 minutes.' },
});
app.set('trust proxy', 1); // behind the host's proxy once deployed
// Read JSON bodies sent by the client, 10 kb max
app.use(express.json({ limit: '10kb' }));
// Express 5 leaves req.body undefined when a request has no JSON body.
// Then req.body.name would crash with a 500; with {} the route answers 400 instead.
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// Quick check that the API is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/places', placesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/photos', photosRouter);

// No route matched -> 404 in JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Errors: broken JSON body -> 400, anything else -> a clean JSON 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
