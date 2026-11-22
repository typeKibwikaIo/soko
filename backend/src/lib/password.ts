import { z } from 'zod';

// Strong password policy: 8+ chars with upper, lower, digit and symbol.
export const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .refine((p) => /[a-z]/.test(p), 'Password needs a lowercase letter')
  .refine((p) => /[A-Z]/.test(p), 'Password needs an uppercase letter')
  .refine((p) => /\d/.test(p), 'Password needs a number')
  .refine((p) => /[^A-Za-z0-9]/.test(p), 'Password needs a symbol (e.g. !@#$%)');
