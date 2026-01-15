'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { getDocument, deleteDocument } from '@/lib/firebase/client-api';
import type { Document } from '@/types';
import { getAuthHeaders } from '@/lib/firebase/client-token';
import { downloadBlob, formatRelativeTime } from '@/lib/utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading-spinner';
import { ArrowLeft, Download, Eye, Trash2, X } from 'lucide-react';
import { ATSScoreDisplay } from '@/components/ats/ats-score-display';
import { VersionManager } from '@/components/versions/version-manager';

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = useMemo(() => String((params as any)?.documentId || ''), [params]);

  const [user] = useAuthState(auth!);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');

  const loadDocument = async () => {
    if (!user || !documentId) return;

    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument(user, documentId);
      setDocument(doc);
      setEditTitle(doc?.title || '');
      setEditJobTitle(doc?.jobTitle || '');
      setEditCompany(doc?.company || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
      setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [user, documentId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchPdfBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    if (!user) throw new Error('Not authenticated');
    const response = await fetch(`/api/documents/download?documentId=${documentId}`, {
      headers: await getAuthHeaders(user),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Failed to generate PDF');
    }

    const fileName =
      response.headers.get('x-document-file-name') || document?.fileName || `document_${documentId}.pdf`;
    const blob = await response.blob();
    return { blob, fileName };
  };

  const handleDownload = async () => {
    setActionLoading(true);
    try {
      const { blob, fileName } = await fetchPdfBlob();
      downloadBlob(blob, fileName);
    } catch (err) {
      console.error(err);
      alert('Failed to download document');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = async () => {
    setActionLoading(true);
    try {
      const { blob } = await fetchPdfBlob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      alert('Failed to preview document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !document) return;
    if (!confirm('Delete this document?')) return;

    setActionLoading(true);
    try {
      await deleteDocument(user, document.id);
      router.push('/history');
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!user || !document) return;

    try {
      setMetaSaving(true);
      const response = await fetch('/api/documents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders(user)),
        },
        body: JSON.stringify({
          documentId: document.id,
          updates: {
            title: editTitle,
            jobTitle: editJobTitle,
            company: editCompany,
          },
          regenerateFileName: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update document');
      }

      await loadDocument();
    } catch (err) {
      console.error(err);
      alert('Failed to update document');
    } finally {
      setMetaSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading document..." />;
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || 'Document not found'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={actionLoading}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={actionLoading}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={actionLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {previewUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{document.title || document.fileName}</CardTitle>
                <CardDescription>Preview (generated on demand)</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-[8.5/11] w-full border rounded-lg overflow-hidden bg-muted">
              <iframe src={previewUrl} className="w-full h-full" title="Document preview" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{document.title || document.fileName}</CardTitle>
          <CardDescription>
            <span className="capitalize">{document.type.replace('_', ' ')}</span> •{' '}
            <span className="capitalize">{document.variant}</span> •{' '}
            {formatRelativeTime(document.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={metaSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
                disabled={metaSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                disabled={metaSaving}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveMeta} disabled={metaSaving}>
              {metaSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>

          {(document.jobTitle || document.company) && (
            <div className="text-sm">
              <span className="text-muted-foreground">Job:</span>{' '}
              <span className="font-medium">
                {document.jobTitle || '—'}{document.company ? ` • ${document.company}` : ''}
              </span>
            </div>
          )}

          {document.templateId && document.type === 'resume' && (
            <div className="text-sm">
              <span className="text-muted-foreground">Template:</span>{' '}
              <span className="font-medium">{document.templateId}</span>
            </div>
          )}

          {document.jobDescription && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Job Description</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {document.jobDescription}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {document.atsScore && document.type === 'resume' && (
        <ATSScoreDisplay score={document.atsScore} showDetails={true} />
      )}

      {user && document.type === 'resume' && (
        <VersionManager
          documentId={document.id}
          userId={user.uid}
          currentData={document.data}
          currentAtsScore={document.atsScore}
        />
      )}
    </div>
  );
}
