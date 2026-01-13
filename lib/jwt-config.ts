// JWT Configuration - separate file to avoid bcrypt dependency in middleware
// This file should only contain edge-compatible code

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

export const JWT_SECRET = new TextEncoder().encode(jwtSecret);
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
