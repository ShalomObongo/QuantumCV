'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { getUserDocuments } from '@/lib/firebase/client-api';
import { Document } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading-spinner';
import { FileText, FilePlus, History } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/helpers';

export default function DashboardPage() {
  const [user] = useAuthState(auth!);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        const docs = await getUserDocuments(user.uid, 5);
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  const resumeCount = documents.filter((d) => d.type === 'resume').length;
  const coverLetterCount = documents.filter((d) => d.type === 'cover_letter').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your documents
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/generate?type=resume">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Create Resume</span>
              </CardTitle>
              <CardDescription>
                Generate a professional AI-powered resume
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/generate?type=cover_letter">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FilePlus className="h-5 w-5" />
                <span>Create Cover Letter</span>
              </CardTitle>
              <CardDescription>
                Generate a tailored cover letter for your application
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Resumes</CardDescription>
            <CardTitle className="text-3xl">{resumeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cover Letters</CardDescription>
            <CardTitle className="text-3xl">{coverLetterCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Documents</CardTitle>
            <Link href="/history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents yet. Create your first one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.type.replace('_', ' ')} • {doc.variant}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(doc.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
