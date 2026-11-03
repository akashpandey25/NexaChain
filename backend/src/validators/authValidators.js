const { z } = require('zod');

// Password complexity: minimum 8 characters, at least one letter and at least one digit
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/;

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  mobileNumber: z
    .string()
    .trim()
    .max(20, 'Mobile number cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one letter and at least one number'
    ),
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'Referral code must be at least 3 characters long')
    .max(30, 'Referral code cannot exceed 30 characters')
    .optional()
    .or(z.literal(''))
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
});

module.exports = {
  registerSchema,
  loginSchema
};

