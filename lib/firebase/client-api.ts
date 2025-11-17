import { Document } from '@/types';

/**
 * Client-side API helpers for Firebase operations
 * These functions make HTTP requests to API routes that use Firebase Admin SDK
 */

export const getUserDocuments = async (
  userId: string,
  limitCount?: number
): Promise<Document[]> => {
  const params = new URLSearchParams({ userId });
  if (limitCount) params.append('limit', limitCount.toString());

  const response = await fetch(`/api/documents?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  const data = await response.json();
  return data.documents || [];
};

export const getDocument = async (documentId: string): Promise<Document | null> => {
  const response = await fetch(`/api/documents?documentId=${documentId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch document');
  }

  const data = await response.json();
  return data.document || null;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  const response = await fetch(`/api/documents?documentId=${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
};
