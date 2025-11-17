'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileText, FilePlus, Download, Check } from 'lucide-react';
import { downloadBlob } from '@/lib/utils/helpers';

type DocumentType = 'resume' | 'cover_letter';

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth);
  const [docType, setDocType] = useState<DocumentType>(
    (searchParams?.get('type') as DocumentType) || 'resume'
  );
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isTailored, setIsTailored] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint =
        docType === 'resume' ? '/api/generate/resume' : '/api/generate/cover-letter';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          resumeText,
          jobDescription: docType === 'cover_letter' ? jobDescription : isTailored ? jobDescription : null,
          isTailored: docType === 'resume' ? isTailored : true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate document');
      }

      // Download PDF
      const pdfBlob = new Blob(
        [Uint8Array.from(atob(data.pdf), (c) => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      downloadBlob(pdfBlob, data.fileName);

      setGeneratedFileName(data.fileName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Document</h1>
        <p className="text-muted-foreground mt-2">
          Create professional documents with AI assistance
        </p>
      </div>

      {/* Document Type Selector */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            docType === 'resume' ? 'border-primary ring-2 ring-primary' : ''
          }`}
          onClick={() => setDocType('resume')}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Resume/CV</span>
            </CardTitle>
            <CardDescription>
              Generate a professional resume tailored to your needs
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            docType === 'cover_letter' ? 'border-primary ring-2 ring-primary' : ''
          }`}
          onClick={() => setDocType('cover_letter')}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FilePlus className="h-5 w-5" />
              <span>Cover Letter</span>
            </CardTitle>
            <CardDescription>
              Create a compelling cover letter for your application
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {docType === 'resume' ? 'Resume Details' : 'Cover Letter Details'}
          </CardTitle>
          <CardDescription>
            Provide your information and we'll generate a professional document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>
                Document generated successfully! File: {generatedFileName}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resumeText">Your Resume Information</Label>
            <Textarea
              id="resumeText"
              placeholder="Paste your current resume text, experience, education, skills, etc..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={10}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include all relevant information: contact details, work experience,
              education, skills, projects, etc.
            </p>
          </div>

          {(docType === 'cover_letter' || isTailored) && (
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description you're applying for..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                disabled={loading}
                required={docType === 'cover_letter'}
              />
              <p className="text-xs text-muted-foreground">
                The AI will tailor your document to match this job description
              </p>
            </div>
          )}

          {docType === 'resume' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tailored"
                checked={isTailored}
                onChange={(e) => setIsTailored(e.target.checked)}
                className="rounded border-gray-300"
                disabled={loading}
              />
              <Label htmlFor="tailored" className="cursor-pointer">
                Tailor resume to job description
              </Label>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !resumeText || (docType === 'cover_letter' && !jobDescription)}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate {docType === 'resume' ? 'Resume' : 'Cover Letter'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
