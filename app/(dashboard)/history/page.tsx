'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { getUserDocuments, deleteDocument } from '@/lib/firebase/client-api';
import { Document } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading-spinner';
import { FileText, Trash2, History, Download, Eye, X } from 'lucide-react';
import { downloadBlob, formatRelativeTime } from '@/lib/utils/helpers';
import { getAuthHeaders } from '@/lib/firebase/client-token';

export default function HistoryPage() {
  const [user] = useAuthState(auth!);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'resume' | 'cover_letter'>('all');
  const [variantFilter, setVariantFilter] = useState<'all' | 'general' | 'tailored'>('all');
  const [preview, setPreview] = useState<{
    documentId: string;
    fileName: string;
    url: string;
  } | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const docs = await getUserDocuments(user, limit);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user, limit]);

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
      if (variantFilter !== 'all' && doc.variant !== variantFilter) return false;

      if (!q) return true;
      const haystack = [
        doc.title,
        doc.fileName,
        doc.jobTitle,
        doc.company,
        doc.type,
        doc.variant,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [documents, search, typeFilter, variantFilter]);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const fetchPdfBlob = async (documentId: string): Promise<{ blob: Blob; fileName: string }> => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/documents/download?documentId=${documentId}`, {
      headers: await getAuthHeaders(user),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Failed to generate PDF');
    }

    const fileName =
      response.headers.get('x-document-file-name') || `document_${documentId}.pdf`;
    const blob = await response.blob();
    return { blob, fileName };
  };

  const handleDownload = async (documentId: string) => {
    setDownloadLoading(documentId);
    try {
      const { blob, fileName } = await fetchPdfBlob(documentId);
      downloadBlob(blob, fileName);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    } finally {
      setDownloadLoading(null);
    }
  };

  const handlePreview = async (documentId: string) => {
    setDownloadLoading(documentId);
    try {
      const { blob, fileName } = await fetchPdfBlob(documentId);

      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }

      const url = URL.createObjectURL(blob);
      setPreview({ documentId, fileName, url });
    } catch (error) {
      console.error('Error previewing document:', error);
      alert('Failed to preview document');
    } finally {
      setDownloadLoading(null);
    }
  };

  const closePreview = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeleteLoading(documentId);
    try {
      if (!user) return;
      await deleteDocument(user, documentId);
      // Refresh documents
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return <Loading text="Loading history..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <History className="h-8 w-8" />
            <span>Document History</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your generated documents
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by title, job, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="typeFilter">Type</Label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="all">All</option>
              <option value="resume">Resume</option>
              <option value="cover_letter">Cover Letter</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="variantFilter">Variant</Label>
            <select
              id="variantFilter"
              value={variantFilter}
              onChange={(e) => setVariantFilter(e.target.value as any)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="all">All</option>
              <option value="general">General</option>
              <option value="tailored">Tailored</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{preview.fileName}</CardTitle>
                <CardDescription>Preview (generated on demand)</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closePreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-[8.5/11] w-full border rounded-lg overflow-hidden bg-muted">
              <iframe
                src={preview.url}
                className="w-full h-full"
                title={`Preview: ${preview.fileName}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first resume or cover letter to get started
            </p>
            <Button asChild>
              <a href="/generate">Generate Document</a>
            </Button>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No documents match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        <Link href={`/history/${doc.id}`} className="hover:underline">
                          {doc.title || doc.fileName}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-2 mt-1">
                          {(doc.jobTitle || doc.company) && (
                            <>
                              <span className="capitalize">
                                {doc.jobTitle || 'job'}
                              </span>
                              {doc.company && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{doc.company}</span>
                                </>
                              )}
                              <span>•</span>
                            </>
                          )}
                          <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{doc.variant}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(doc.createdAt)}</span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(doc.id)}
                      disabled={downloadLoading === doc.id}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.id)}
                      disabled={downloadLoading === doc.id}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadLoading === doc.id ? 'Generating…' : 'Download'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteLoading === doc.id}
                    >
                      {deleteLoading === doc.id ? (
                        <Loading />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {doc.jobDescription && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Job Description:</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {doc.jobDescription}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setLimit((v) => v + 50)} disabled={loading}>
          Load more
        </Button>
      </div>
    </div>
  );
}
