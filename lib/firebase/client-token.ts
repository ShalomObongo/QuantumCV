import type { User } from 'firebase/auth';

export async function getAuthToken(user: User): Promise<string> {
  return user.getIdToken();
}

export async function getAuthHeaders(user: User): Promise<Record<string, string>> {
  const token = await getAuthToken(user);
  return { Authorization: `Bearer ${token}` };
}

