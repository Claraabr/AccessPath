import { z } from 'zod';

// Describe the shape once (session 21): wrong type -> 400 before Mongo sees it,
// .trim() cleans as it checks, unknown keys are dropped
export const SignupInput = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['user', 'venue', 'supplier']).default('user'),
});

export const LoginInput = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().max(100),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues[0].message;
    return res.status(400).json({ error: msg });
  }
  req.body = result.data; // only the declared fields
  next();
};
