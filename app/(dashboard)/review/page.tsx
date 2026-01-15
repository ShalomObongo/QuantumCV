'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading-spinner';
import { Upload, FileText, CheckCircle2, XCircle, Download, AlertCircle } from 'lucide-react';
import { ReviewSuggestion } from '@/lib/ai/review';
import { ResumeData } from '@/types';
import { EnhancedATSScore } from '@/lib/ats/enhanced-scorer';
import { getAuthHeaders } from '@/lib/firebase/client-token';

export default function ReviewPage() {
  const [user] = useAuthState(auth!);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [applyingChanges, setApplyingChanges] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleReview = async () => {
    if (!pdfFile || !user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const response = await fetch('/api/review-resume', {
        method: 'POST',
        body: formData,
        headers: await getAuthHeaders(user),
      });

      if (!response.ok) {
        throw new Error('Failed to review resume');
      }

      const data = await response.json();
      setReviewResult(data);
      setAcceptedSuggestions(new Set());
    } catch (error) {
      console.error('Review error:', error);
      alert('Failed to review resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (suggestionId: string) => {
    const newAccepted = new Set(acceptedSuggestions);
    if (newAccepted.has(suggestionId)) {
      newAccepted.delete(suggestionId);
    } else {
      newAccepted.add(suggestionId);
    }
    setAcceptedSuggestions(newAccepted);
  };

  const handleApplyChanges = async () => {
    if (!reviewResult || acceptedSuggestions.size === 0) return;

    setApplyingChanges(true);
    try {
      const selectedSuggestions = reviewResult.aiReview.suggestions.filter(
        (s: ReviewSuggestion) => acceptedSuggestions.has(s.id)
      );

      const response = await fetch('/api/apply-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders(user!)),
        },
        body: JSON.stringify({
          resumeData: reviewResult.resumeData,
          acceptedSuggestions: selectedSuggestions,
          jobDescription: jobDescription || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply suggestions');
      }

      const data = await response.json();

      // Update review result with new resume data
      setReviewResult({
        ...reviewResult,
        resumeData: data.resumeData,
      });

      alert('Changes applied successfully! You can now generate your optimized resume.');
    } catch (error) {
      console.error('Apply changes error:', error);
      alert('Failed to apply changes. Please try again.');
    } finally {
      setApplyingChanges(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!reviewResult || !user) return;

    try {
      // Navigate to generate page with pre-filled data
      const resumeData = reviewResult.resumeData;
      sessionStorage.setItem('prefilledResumeData', JSON.stringify(resumeData));
      window.location.href = '/generate?type=resume&prefilled=true';
    } catch (error) {
      console.error('Generate resume error:', error);
      alert('Failed to prepare resume generation.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴 Critical';
      case 'high': return '🟠 High';
      case 'medium': return '🟡 Medium';
      case 'low': return '🔵 Low';
      default: return priority;
    }
  };

  // Batch selection functions
  const selectAll = () => {
    if (!reviewResult) return;
    const allIds = reviewResult.aiReview.suggestions.map((s: ReviewSuggestion) => s.id);
    setAcceptedSuggestions(new Set(allIds));
  };

  const selectNone = () => {
    setAcceptedSuggestions(new Set());
  };

  const selectByPriority = (priority: string) => {
    if (!reviewResult) return;
    const filtered = reviewResult.aiReview.suggestions
      .filter((s: ReviewSuggestion) => s.priority === priority)
      .map((s: ReviewSuggestion) => s.id);
    setAcceptedSuggestions(new Set(filtered));
  };

  // Export suggestions as checklist
  const exportAsChecklist = () => {
    if (!reviewResult) return;

    const suggestions = reviewResult.aiReview.suggestions;
    let markdown = `# Resume Improvement Checklist\n\n`;
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;
    markdown += `## Overall Assessment\n${reviewResult.aiReview.overallAssessment}\n\n`;
    markdown += `## Current ATS Score: ${reviewResult.atsScore.overall}/100\n`;
    markdown += `## Potential Score: ${reviewResult.aiReview.scoreImpact.potentialScore}/100\n\n`;

    // Group by category
    const byCategory: Record<string, ReviewSuggestion[]> = {};
    suggestions.forEach((s: ReviewSuggestion) => {
      if (!byCategory[s.category]) {
        byCategory[s.category] = [];
      }
      byCategory[s.category].push(s);
    });

    Object.keys(byCategory).forEach((category) => {
      markdown += `## ${category.toUpperCase()}\n\n`;
      byCategory[category].forEach((s: ReviewSuggestion) => {
        markdown += `### [ ] ${s.section}: ${s.issue}\n`;
        markdown += `**Priority:** ${s.priority}\n\n`;
        markdown += `**Action:** ${s.suggestion}\n\n`;
        if (s.example) {
          markdown += `**Example:** ${s.example}\n\n`;
        }
        markdown += `**Why it matters:** ${s.reasoning}\n\n`;
        markdown += `---\n\n`;
      });
    });

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-improvements-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Resume Review & Optimization</h1>
        <p className="text-muted-foreground mt-2">
          Upload your resume for comprehensive ATS analysis and AI-powered improvement suggestions
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            Upload your existing resume (PDF format) and optionally provide a job description for tailored feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Resume PDF</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                <span>{pdfFile ? pdfFile.name : 'Choose PDF file'}</span>
              </label>
              {pdfFile && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for tailored suggestions..."
              className="w-full min-h-[150px] p-3 border rounded-md"
            />
          </div>

          <Button
            onClick={handleReview}
            disabled={!pdfFile || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loading text="" />
                <span className="ml-2">Analyzing Resume...</span>
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Review Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {reviewResult && (
        <>
          {/* ATS Score */}
          <Card>
            <CardHeader>
              <CardTitle>ATS Score Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold">{reviewResult.atsScore.overall}/100</div>
                  <div className="text-sm text-muted-foreground">Overall ATS Score</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-green-600">
                    {reviewResult.aiReview.scoreImpact.potentialScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Potential Score</div>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-4">
                {Object.entries(reviewResult.atsScore.breakdown).map(([key, value]: [string, any]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground capitalize">{key}</div>
                  </div>
                ))}
              </div>

              {reviewResult.atsScore.pdfAnalysis && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">PDF Analysis</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Word Count:</span>{' '}
                      <span className="font-medium">{reviewResult.atsScore.pdfAnalysis.wordCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Readability:</span>{' '}
                      <span className="font-medium">{reviewResult.atsScore.pdfAnalysis.readabilityScore}/100</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sections:</span>{' '}
                      <span className="font-medium">{reviewResult.atsScore.pdfAnalysis.sectionsFound.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Review */}
          <Card>
            <CardHeader>
              <CardTitle>AI Expert Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Overall Assessment</h4>
                <p className="text-muted-foreground">{reviewResult.aiReview.overallAssessment}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">✓ Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {reviewResult.aiReview.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="text-muted-foreground">{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-orange-600">⚠ Weaknesses</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {reviewResult.aiReview.weaknesses.map((weakness: string, idx: number) => (
                      <li key={idx} className="text-muted-foreground">{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Improvement Suggestions</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {acceptedSuggestions.size} of {reviewResult.aiReview.suggestions.length} selected
                </span>
              </CardTitle>
              <CardDescription>
                Review and select suggestions to apply. Click on any suggestion to accept/reject it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Batch Actions */}
              <div className="flex flex-wrap gap-2 pb-4 border-b">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Select None
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectByPriority('critical')}>
                  Critical Only
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectByPriority('high')}>
                  High Priority
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectByPriority('medium')}>
                  Medium Priority
                </Button>
                <Button variant="outline" size="sm" onClick={exportAsChecklist}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Checklist
                </Button>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
              {reviewResult.aiReview.suggestions.map((suggestion: ReviewSuggestion) => {
                const isAccepted = acceptedSuggestions.has(suggestion.id);
                return (
                  <div
                    key={suggestion.id}
                    onClick={() => toggleSuggestion(suggestion.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isAccepted ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    } ${getPriorityColor(suggestion.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {isAccepted ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 border-2 rounded-full" />
                          )}
                          <span className="text-xs font-medium uppercase tracking-wide">
                            {getPriorityBadge(suggestion.priority)} • {suggestion.category}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{suggestion.section}: {suggestion.issue}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{suggestion.suggestion}</p>
                        {suggestion.example && (
                          <div className="mt-2 p-2 bg-background/50 rounded text-sm italic">
                            Example: {suggestion.example}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          <AlertCircle className="inline h-3 w-3 mr-1" />
                          {suggestion.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleApplyChanges}
              disabled={acceptedSuggestions.size === 0 || applyingChanges}
              className="flex-1"
            >
              {applyingChanges ? (
                <>
                  <Loading text="" />
                  <span className="ml-2">Applying Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Apply {acceptedSuggestions.size} Suggestion{acceptedSuggestions.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateResume}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Optimized Resume
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
