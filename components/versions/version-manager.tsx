'use client';

import { useState, useEffect } from 'react';
import { ResumeVersion } from '@/types';
import { getVersions, deleteVersion, updateVersionName, createVersion } from '@/lib/firebase/version-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  History,
  Save,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VersionManagerProps {
  documentId: string;
  userId: string;
  currentData: any;
  currentAtsScore?: any;
  onVersionRestore?: (versionId: string) => void;
}

export function VersionManager({
  documentId,
  userId,
  currentData,
  currentAtsScore,
  onVersionRestore,
}: VersionManagerProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(documentId);
      setVersions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) {
      setError('Version name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createVersion({
        documentId,
        userId,
        versionName: newVersionName.trim(),
        data: currentData,
        atsScore: currentAtsScore,
      });
      setNewVersionName('');
      await loadVersions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) {
      return;
    }

    try {
      await deleteVersion(versionId);
      await loadVersions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStartEdit = (version: ResumeVersion) => {
    setEditingId(version.id);
    setEditingName(version.versionName);
  };

  const handleSaveEdit = async (versionId: string) => {
    if (!editingName.trim()) {
      setError('Version name cannot be empty');
      return;
    }

    try {
      await updateVersionName(versionId, editingName.trim());
      setEditingId(null);
      await loadVersions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Save New Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>Save Current Version</span>
          </CardTitle>
          <CardDescription>
            Create a snapshot of your current resume to track changes over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., Software Engineer at Google"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveVersion();
                }
              }}
            />
            <Button onClick={handleSaveVersion} disabled={saving || !newVersionName.trim()}>
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Version History</span>
          </CardTitle>
          <CardDescription>
            {versions.length} saved version{versions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No versions saved yet</p>
              <p className="text-sm mt-1">
                Save your first version above to start tracking changes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {editingId === version.id ? (
                      <div className="flex items-center space-x-2 mb-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(version.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveEdit(version.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold truncate">
                          {version.versionName}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(version)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Version {version.versionNumber} •{' '}
                          {formatDistanceToNow(version.createdAt, { addSuffix: true })}
                        </span>
                      </div>

                      {version.atsScore && (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>
                            ATS:{' '}
                            <span className={getScoreColor(version.atsScore.overall)}>
                              {version.atsScore.overall}/100
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onVersionRestore && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onVersionRestore(version.id)}
                      >
                        Restore
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteVersion(version.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
