'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TemplateSelector } from '@/components/templates/template-selector';
import { ATSScoreDisplay } from '@/components/ats/ats-score-display';
import { ResumeUploader } from '@/components/upload/resume-uploader';
import { FileText, FilePlus, Download, Check } from 'lucide-react';
import { downloadBlob } from '@/lib/utils/helpers';
import { TemplateId, ATSScore, ResumeData, Job } from '@/types';
import { getAuthHeaders } from '@/lib/firebase/client-token';

type DocumentType = 'resume' | 'cover_letter';
type ResumeSource = 'text' | 'saved' | 'uploaded' | 'prefilled';

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth!);
  const [docType, setDocType] = useState<DocumentType>(
    (searchParams?.get('type') as DocumentType) || 'resume'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern');

  const [resumeSource, setResumeSource] = useState<ResumeSource>('text');
  const [savedResumeData, setSavedResumeData] = useState<ResumeData | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeDataLoading, setResumeDataLoading] = useState(false);
  const resumeSourceTouchedRef = useRef(false);

  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobId, setJobId] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [documentTitle, setDocumentTitle] = useState('');

  const [isTailored, setIsTailored] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [coverTone, setCoverTone] = useState<'professional' | 'friendly' | 'bold'>('professional');
  const [coverLength, setCoverLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [coverFormat, setCoverFormat] = useState<'paragraphs' | 'bullets'>('paragraphs');

  const resumeSourceReady = useMemo(() => {
    if (resumeSource === 'text') {
      return resumeText.trim().length > 0;
    }
    return Boolean(resumeData);
  }, [resumeSource, resumeText, resumeData]);

  const needsJobDescription = useMemo(() => {
    return docType === 'cover_letter' || (docType === 'resume' && isTailored);
  }, [docType, isTailored]);

  // Load saved resume data (for "Saved Resume Data" source)
  useEffect(() => {
    const loadResumeData = async () => {
      if (!user) return;

      try {
        setResumeDataLoading(true);
        const response = await fetch('/api/resume-data', {
          headers: await getAuthHeaders(user),
        });
        const data = await response.json();
        if (response.ok && data.resumeData) {
          setSavedResumeData(data.resumeData);
        }
      } catch (err) {
        // Silent: resume data is optional
      } finally {
        setResumeDataLoading(false);
      }
    };

    loadResumeData();
  }, [user]);

  useEffect(() => {
    if (resumeSourceTouchedRef.current) return;
    if (resumeSource !== 'text') return;
    if (!savedResumeData) return;

    setResumeData(savedResumeData);
    setResumeSource('saved');
  }, [resumeSource, savedResumeData]);

  // Load jobs for quick selection
  useEffect(() => {
    const loadJobs = async () => {
      if (!user) return;
      try {
        setJobsLoading(true);
        const response = await fetch('/api/jobs?limit=50', {
          headers: await getAuthHeaders(user),
        });
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs || []);
        }
      } catch (err) {
        // Silent: jobs are optional
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, [user]);

  // Prefilled resume data from Review flow
  useEffect(() => {
    const prefilled = searchParams?.get('prefilled') === 'true';
    if (!prefilled) return;

    try {
      const raw = sessionStorage.getItem('prefilledResumeData');
      if (!raw) return;
      const parsed = JSON.parse(raw) as ResumeData;
      setResumeData(parsed);
      setResumeSource('prefilled');
    } catch (err) {
      // Ignore
    }
  }, [searchParams]);

  const handleJobSelect = (selectedJobId: string) => {
    setJobId(selectedJobId);
    const selected = jobs.find((j) => j.id === selectedJobId);
    if (!selected) return;

    setJobTitle(selected.title);
    setCompany(selected.company || '');
    setJobDescription(selected.description);
  };

  const handleGenerate = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setAtsScore(null);
    setGeneratedCoverLetter(null);

    try {
      const endpoint =
        docType === 'resume' ? '/api/generate/resume' : '/api/generate/cover-letter';

      const payload: any = {
        jobTitle: jobTitle || undefined,
        company: company || undefined,
        title: documentTitle || undefined,
        jobId: jobId || undefined,
      };

      if (docType === 'cover_letter') {
        payload.coverLetterOptions = {
          tone: coverTone,
          length: coverLength,
          format: coverFormat,
        };
      }

      if (resumeSource === 'text') {
        payload.resumeText = resumeText;
      } else {
        payload.resumeData = resumeData;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders(user)),
        },
        body: JSON.stringify({
          ...payload,
          jobDescription:
            docType === 'cover_letter'
              ? jobDescription
              : isTailored
                ? jobDescription
                : null,
          isTailored: docType === 'resume' ? isTailored : true,
          templateId: docType === 'resume' ? selectedTemplate : undefined,
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
      if (data.atsScore && docType === 'resume') {
        setAtsScore(data.atsScore);
      }
      if (data.content && docType === 'cover_letter') {
        setGeneratedCoverLetter(data.content);
      }
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

      {/* Template Selector (only for resumes) */}
      {docType === 'resume' && (
        <Card>
          <CardContent className="pt-6">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          </CardContent>
        </Card>
      )}

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {docType === 'resume' ? 'Resume Details' : 'Cover Letter Details'}
          </CardTitle>
          <CardDescription>
            Provide your information and we&apos;ll generate a professional document
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
            <Label htmlFor="documentTitle">Document title (optional)</Label>
            <Input
              id="documentTitle"
              placeholder="e.g., Google SWE Resume (Tailored)"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This is shown in History. The PDF filename is generated from your name + job.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="savedJob">Saved job (optional)</Label>
            <div className="flex items-center gap-2">
              <select
                id="savedJob"
                value={jobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                disabled={loading || jobsLoading}
              >
                <option value="">Select a saved job…</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}{job.company ? ` • ${job.company}` : ''}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" asChild>
                <a href="/jobs">Manage</a>
              </Button>
            </div>
            {jobsLoading && (
              <p className="text-xs text-muted-foreground">Loading jobs…</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Target job title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Full Stack Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                placeholder="e.g., Erudite Digital"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Resume source</Label>
              {resumeDataLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card
                className={`cursor-pointer transition-all p-4 ${
                  resumeSource === 'text' ? 'border-primary ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  resumeSourceTouchedRef.current = true;
                  setResumeSource('text');
                }}
              >
                <div className="font-medium">Paste text</div>
                <div className="text-sm text-muted-foreground">
                  Fastest way to start
                </div>
              </Card>

              <Card
                className={`cursor-pointer transition-all p-4 ${
                  resumeSource === 'saved' ? 'border-primary ring-2 ring-primary' : ''
                } ${!savedResumeData ? 'opacity-60' : ''}`}
                onClick={() => {
                  if (!savedResumeData) return;
                  resumeSourceTouchedRef.current = true;
                  setResumeData(savedResumeData);
                  setResumeSource('saved');
                }}
              >
                <div className="font-medium">Saved resume data</div>
                <div className="text-sm text-muted-foreground">
                  Uses your saved profile
                </div>
              </Card>

              <Card
                className={`cursor-pointer transition-all p-4 ${
                  resumeSource === 'uploaded' ? 'border-primary ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  resumeSourceTouchedRef.current = true;
                  setResumeSource('uploaded');
                  setResumeData(null);
                }}
              >
                <div className="font-medium">Upload resume</div>
                <div className="text-sm text-muted-foreground">
                  Parse a PDF or TXT
                </div>
              </Card>
            </div>

            {resumeSource === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="resumeText">Resume text</Label>
                <Textarea
                  id="resumeText"
                  placeholder="Paste your current resume text, experience, education, skills, etc..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={10}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Include contact details, work experience, education, skills, projects, etc.
                </p>
              </div>
            )}

            {(resumeSource === 'saved' || resumeSource === 'prefilled') && resumeData && (
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">
                      {resumeData.contactInfo?.name || '—'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Experience: {resumeData.experience?.length || 0} • Education:{' '}
                    {resumeData.education?.length || 0} • Projects:{' '}
                    {resumeData.projects?.length || 0}
                  </div>
                  {resumeSource === 'saved' && (
                    <Button variant="outline" size="sm" asChild>
                      <a href="/edit-resume">Edit saved resume data</a>
                    </Button>
                  )}
                  {resumeSource === 'prefilled' && (
                    <p className="text-xs text-muted-foreground">
                      Loaded from your Review session.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {resumeSource === 'uploaded' && (
              <ResumeUploader
                onDataExtracted={(data) => {
                  setResumeData(data);
                  setResumeSource('uploaded');
                }}
                onError={(message) => setError(message)}
              />
            )}
          </div>

          {needsJobDescription && (
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description you're applying for..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                disabled={loading}
                required={needsJobDescription}
              />
              <p className="text-xs text-muted-foreground">
                The AI will tailor your document to match this job description
              </p>
            </div>
          )}

          {docType === 'cover_letter' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverTone">Tone</Label>
                <select
                  id="coverTone"
                  value={coverTone}
                  onChange={(e) => setCoverTone(e.target.value as typeof coverTone)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverLength">Length</Label>
                <select
                  id="coverLength"
                  value={coverLength}
                  onChange={(e) => setCoverLength(e.target.value as typeof coverLength)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverFormat">Format</Label>
                <select
                  id="coverFormat"
                  value={coverFormat}
                  onChange={(e) => setCoverFormat(e.target.value as typeof coverFormat)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="paragraphs">Paragraphs</option>
                  <option value="bullets">Bullets</option>
                </select>
              </div>
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
            disabled={
              loading ||
              !resumeSourceReady ||
              (needsJobDescription && jobDescription.trim().length === 0)
            }
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

      {/* ATS Score Display (only for resumes) */}
      {atsScore && docType === 'resume' && (
        <div className="mt-6">
          <ATSScoreDisplay score={atsScore} showDetails={true} />
        </div>
      )}

      {generatedCoverLetter && docType === 'cover_letter' && (
        <Card>
          <CardHeader>
            <CardTitle>Cover Letter Text</CardTitle>
            <CardDescription>Copy/paste into an email if needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={generatedCoverLetter} readOnly rows={12} />
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(generatedCoverLetter)}
            >
              Copy to clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
