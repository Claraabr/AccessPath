import { User } from '../models/User.js';

// Authorization: are you allowed? Logged in but wrong role -> 403
// requireRole('venue') or requireRole('user', 'venue') RETURNS a middleware
// that only lets those roles through.
// Always used AFTER requireAuth, which sets req.userId
export function requireRole(...roles) {
  return async function (req, res, next) {
    const user = await User.findById(req.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Only ${roles.join(' or ')} accounts can do this` });
    }
    next();
  };
}
