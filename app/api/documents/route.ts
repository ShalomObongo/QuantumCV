import { NextRequest, NextResponse } from 'next/server';
import {
  getUserDocuments,
  deleteDocument,
  getDocument,
  updateDocument,
} from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { buildDocumentFileName } from '@/lib/utils/file-name';
import { enforceMaxBodySize, RequestSizeError } from '@/lib/server/request-size';
import { z } from 'zod';

const updateDocumentSchema = z.object({
  documentId: z.string().min(1),
  updates: z
    .object({
      title: z.string().optional(),
      jobTitle: z.string().optional(),
      company: z.string().optional(),
    })
    .optional(),
  regenerateFileName: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (documentId) {
      // Get single document
      const document = await getDocument(documentId);
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      if (document.userId !== uid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ document });
    }

    // Get user documents
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const documents = await getUserDocuments(uid, limit);
    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId parameter' },
        { status: 400 }
      );
    }

    const document = await getDocument(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteDocument(documentId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { uid, name, email } = await requireAuth(request);
    enforceMaxBodySize(request, 64 * 1024);
    const body = await request.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { documentId, updates, regenerateFileName } = parsed.data;

    const document = await getDocument(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (document.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed: any = {};
    if (updates && typeof updates === 'object') {
      if (typeof updates.title === 'string') allowed.title = updates.title.trim();
      if (typeof updates.jobTitle === 'string') allowed.jobTitle = updates.jobTitle.trim();
      if (typeof updates.company === 'string') allowed.company = updates.company.trim();
    }

    const shouldRegen = Boolean(regenerateFileName) || Boolean(allowed.jobTitle) || Boolean(allowed.company);
    if (shouldRegen) {
      const candidateName =
        document.data?.contactInfo?.name || name || (email ? email.split('@')[0] : undefined);

      const nextJobTitle = allowed.jobTitle || document.jobTitle;
      const nextCompany = allowed.company || document.company;

      allowed.fileName = buildDocumentFileName({
        type: document.type === 'cover_letter' ? 'cover_letter' : 'resume',
        variant: document.variant,
        candidateName,
        jobTitle: nextJobTitle,
        company: nextCompany,
      });
    }

    await updateDocument(documentId, allowed);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating document:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: 500 }
    );
  }
}
