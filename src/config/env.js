const dotenv = require("dotenv");
const { z } = require("zod");

// Load environment variables
dotenv.config();

// Define environment variable rules
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),

  JWT_EXPIRES_IN: z.string().default("1d"),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  CLIENT_ORIGIN: z.string().default("*"),
});

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

// Export validated configuration
module.exports = parsedEnv.data;