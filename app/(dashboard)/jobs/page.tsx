'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/firebase/client-token';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading-spinner';
import { Briefcase, Trash2 } from 'lucide-react';

const JOB_STATUSES: Job['status'][] = ['saved', 'applied', 'interviewing', 'offer', 'rejected'];

export default function JobsPage() {
  const [user] = useAuthState(auth!);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const loadJobs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/jobs?limit=50', {
        headers: await getAuthHeaders(user),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load jobs');
      }
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      setError('Job title and description are required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders(user)),
        },
        body: JSON.stringify({
          title,
          company: company || undefined,
          url: url || undefined,
          description,
          status: 'saved',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      setTitle('');
      setCompany('');
      setUrl('');
      setDescription('');
      await loadJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!user) return;
    if (!confirm('Delete this job?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/jobs?jobId=${jobId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(user),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }
      await loadJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const handleUpdateStatus = async (jobId: string, status: Job['status']) => {
    if (!user) return;

    try {
      setError(null);
      const response = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders(user)),
        },
        body: JSON.stringify({
          jobId,
          updates: { status },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update job');
      }
      await loadJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to update job');
    }
  };

  if (loading) {
    return <Loading text="Loading jobs..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Jobs
        </h1>
        <p className="text-muted-foreground mt-2">
          Save job descriptions so you can reuse them when generating resumes and cover letters.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Job</CardTitle>
          <CardDescription>Store a job description for quick reuse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Full Stack Developer"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobCompany">Company (optional)</Label>
              <Input
                id="jobCompany"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Erudite Digital"
                disabled={creating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job URL (optional)</Label>
            <Input
              id="jobUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job description</Label>
            <Textarea
              id="jobDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Paste the job description here…"
              disabled={creating}
            />
          </div>

          <Button onClick={handleCreate} disabled={creating || !title.trim() || !description.trim()}>
            {creating ? 'Saving…' : 'Save Job'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Jobs</CardTitle>
          <CardDescription>{jobs.length} saved job{jobs.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No jobs saved yet.</div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {job.title}
                        {job.company ? ` • ${job.company}` : ''}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.url ? (
                          <a href={job.url} target="_blank" rel="noreferrer" className="hover:underline">
                            {job.url}
                          </a>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={job.status}
                        onChange={(e) => handleUpdateStatus(job.id, e.target.value as Job['status'])}
                        className="p-2 border rounded-md bg-background text-sm"
                      >
                        {JOB_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(job.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

