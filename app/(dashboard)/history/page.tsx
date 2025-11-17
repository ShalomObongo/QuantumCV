'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { getUserDocuments } from '@/lib/firebase/db-utils';
import { Document } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading-spinner';
import { FileText, Trash2, History } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/helpers';

export default function HistoryPage() {
  const [user] = useAuthState(auth);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const docs = await getUserDocuments(user.uid, 50);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeleteLoading(documentId);
    try {
      const response = await fetch(`/api/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

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
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

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
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{doc.fileName}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{doc.variant}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(doc.createdAt)}</span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
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
    </div>
  );
}
