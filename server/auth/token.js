import jwt from 'jsonwebtoken';

// The secret is read when a token is made or checked, after dotenv has loaded .env

// Create a token that says "this is user <id>", valid for 1 hour
export function signToken(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Throws if the token was tampered with or has expired
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
