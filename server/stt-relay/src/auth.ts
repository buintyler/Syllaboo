import { verifyToken } from '@clerk/backend';

/**
 * Verifies a Clerk JWT and returns the userId (sub claim) on success.
 * Returns null if the token is invalid or expired.
 */
export async function verifyClerkToken(token: string): Promise<string | null> {
  const secretKey = process.env['CLERK_SECRET_KEY'];

  if (!secretKey) {
    // In local dev without a secret key, skip verification
    if (process.env['NODE_ENV'] !== 'production') {
      console.warn('CLERK_SECRET_KEY not set — skipping JWT verification in development');
      return 'dev-user';
    }
    throw new Error('CLERK_SECRET_KEY is required in production');
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    return null;
  }
}
