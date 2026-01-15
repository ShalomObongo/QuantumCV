import { Document } from '@/types';
import type { User } from 'firebase/auth';
import { getAuthHeaders } from '@/lib/firebase/client-token';

/**
 * Client-side API helpers for Firebase operations
 * These functions make HTTP requests to API routes that use Firebase Admin SDK
 */

export const getUserDocuments = async (
  user: User,
  limitCount?: number
): Promise<Document[]> => {
  const params = new URLSearchParams();
  if (limitCount) params.append('limit', limitCount.toString());

  const response = await fetch(`/api/documents?${params}`, {
    headers: await getAuthHeaders(user),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  const data = await response.json();
  return data.documents || [];
};

export const getDocument = async (
  user: User,
  documentId: string
): Promise<Document | null> => {
  const response = await fetch(`/api/documents?documentId=${documentId}`, {
    headers: await getAuthHeaders(user),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch document');
  }

  const data = await response.json();
  return data.document || null;
};

export const deleteDocument = async (user: User, documentId: string): Promise<void> => {
  const response = await fetch(`/api/documents?documentId=${documentId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(user),
  });

  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
};
