import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { signToken } from '../auth/token.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, SignupInput, LoginInput } from '../middleware/validate.js';

const authRouter = express.Router();

// What we send back about a user: never the passwordHash
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/signup -> validate, hash, save, sign
// (validate already checked the types, trimmed and lowercased the email)
authRouter.post('/signup', validate(SignupInput), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    // role is one of user / venue / supplier, the schema refuses anything else
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login -> find, compare, sign
authRouter.post('/login', validate(LoginInput), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  // Same message in both cases, so nobody can guess which emails exist
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me -> who is logged in (the React app needs the role)
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user));
});

export default authRouter;
