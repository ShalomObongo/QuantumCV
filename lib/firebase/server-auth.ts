import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token;
}

export async function requireAuth(request: NextRequest): Promise<{
  uid: string;
  email?: string;
  name?: string;
}> {
  if (!adminAuth) {
    throw new AuthError(
      'Server authentication is not configured. Set Firebase Admin env vars.',
      500
    );
  }

  const token = getBearerToken(request);
  if (!token) {
    throw new AuthError('Missing Authorization header');
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email, name: decoded.name };
  } catch (error) {
    throw new AuthError('Invalid or expired token');
  }
}

