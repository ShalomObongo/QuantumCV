'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/firebase/client-token';
import type { CustomTemplateMeta } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading-spinner';
import { Trash2, Upload } from 'lucide-react';

export default function TemplatesPage() {
  const [user] = useAuthState(auth!);
  const [templates, setTemplates] = useState<CustomTemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'html' | 'pdf'>('html');
  const [file, setFile] = useState<File | null>(null);

  const loadTemplates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/custom-templates', {
        headers: await getAuthHeaders(user),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load templates');
      }

      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const handleUpload = async () => {
    if (!user) return;
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    if (!file) {
      setError('Select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', templateName.trim());
      formData.append('type', templateType);
      formData.append('file', file);

      const response = await fetch('/api/custom-templates', {
        method: 'POST',
        headers: await getAuthHeaders(user),
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload template');
      }

      setTemplateName('');
      setFile(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!user) return;
    if (!confirm('Delete this template?')) return;

    try {
      const response = await fetch(`/api/custom-templates?templateId=${templateId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(user),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template');
      }

      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    }
  };

  if (loading) {
    return <Loading text="Loading templates..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your custom resume templates (HTML or PDF).
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Custom Template
          </CardTitle>
          <CardDescription>
            After uploading, custom templates appear in the Resume template picker as “Custom”.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., My Company Template"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateType">Type</Label>
              <select
                id="templateType"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as 'html' | 'pdf')}
                className="w-full p-2 border rounded-md bg-background"
                disabled={uploading}
              >
                <option value="html">HTML</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateFile">Template file</Label>
            <Input
              id="templateFile"
              type="file"
              accept={templateType === 'pdf' ? '.pdf' : '.html,.htm'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !templateName.trim() || !file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom templates yet.
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t.type.toUpperCase()} • {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(t.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

