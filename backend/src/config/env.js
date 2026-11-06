const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// Always load environment variables from backend/.env relative to this config file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define validation schema for environment variables
const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error(`PORT must be a valid integer between 1 and 65535, received: ${val}`);
      }
      return parsed;
    }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGO_URI: z
    .string({
      required_error: 'MONGO_URI is required to establish a database connection'
    })
    .min(1, 'MONGO_URI cannot be empty'),
  JWT_SECRET: z
    .string({
      required_error: 'JWT_SECRET is required for token signing and security'
    })
    .min(1, 'JWT_SECRET cannot be empty'),
  JWT_EXPIRES_IN: z
    .string()
    .default('1d'),
  CLIENT_URL: z
    .string()
    .url('CLIENT_URL must be a valid URL (e.g. http://localhost:5173)')
    .default('http://localhost:5173'),
  CRON_TIMEZONE: z
    .string()
    .default('Asia/Kolkata'),
  INVESTMENT_ACTIVATION_ENABLED: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true' || val === '1')
});

let validatedEnv;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorDetails = error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'Variable'}: ${issue.message}`)
      .join('\n');
    console.error('❌ Environment configuration validation failed:\n' + errorDetails);
  } else {
    console.error('❌ Unexpected error validating environment configuration:', error.message);
  }
  process.exit(1);
}

const env = {
  port: validatedEnv.PORT,
  nodeEnv: validatedEnv.NODE_ENV,
  mongoUri: validatedEnv.MONGO_URI,
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
  clientUrl: validatedEnv.CLIENT_URL,
  cronTimezone: validatedEnv.CRON_TIMEZONE,
  investmentActivationEnabled: validatedEnv.INVESTMENT_ACTIVATION_ENABLED ?? false,
  isProduction: validatedEnv.NODE_ENV === 'production',
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isTest: validatedEnv.NODE_ENV === 'test'
};

module.exports = env;
