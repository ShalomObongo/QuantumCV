'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Download, Eye, RefreshCw } from 'lucide-react';
import { getAllTemplates } from '@/lib/templates/config';
import { CustomTemplateMeta, ResumeData, TemplateId } from '@/types';
import { getAuthHeaders } from '@/lib/firebase/client-token';
import { downloadBlob } from '@/lib/utils/helpers';

export default function TemplateComparePage() {
  const [user] = useAuthState(auth!);
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [templateA, setTemplateA] = useState<TemplateId>('modern');
  const [templateB, setTemplateB] = useState<TemplateId>('classic');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateMeta[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<{
    a: string | null;
    b: string | null;
    fileNameA?: string;
    fileNameB?: string;
  }>({ a: null, b: null });

  const builtInTemplates = getAllTemplates();
  const customTemplateMap = useMemo(() => {
    const map = new Map<string, CustomTemplateMeta>();
    for (const t of customTemplates) {
      map.set(`custom-${t.id}`, t);
    }
    return map;
  }, [customTemplates]);

  useEffect(() => {
    // Load saved resume data
    const loadResumeData = async () => {
      if (!user) return;

      try {
        setResumeLoading(true);
        const response = await fetch(`/api/resume-data`, {
          headers: await getAuthHeaders(user),
        });
        if (response.ok) {
          const data = await response.json();
          setResumeData(data.resumeData);
        }
      } catch (error) {
        console.error('Error loading resume data:', error);
      } finally {
        setResumeLoading(false);
      }
    };

    loadResumeData();
  }, [user]);

  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!user) return;

      try {
        setCustomLoading(true);
        const response = await fetch('/api/custom-templates', {
          headers: await getAuthHeaders(user),
        });
        const data = await response.json();
        if (response.ok) {
          setCustomTemplates(data.templates || []);
        } else {
          setCustomTemplates([]);
        }
      } catch (error) {
        console.error('Error loading custom templates:', error);
        setCustomTemplates([]);
      } finally {
        setCustomLoading(false);
      }
    };

    loadCustomTemplates();
  }, [user]);

  const clearResults = () => {
    setGeneratedPDFs({ a: null, b: null });
  };

  const generateComparison = async () => {
    if (!user || !resumeData) {
      alert('Please save your resume data first in the Edit Resume page.');
      return;
    }

    setLoading(true);
    clearResults();

    try {
      const authHeaders = await getAuthHeaders(user);

      const [responseA, responseB] = await Promise.all([
        fetch('/api/generate/resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            resumeData,
            templateId: templateA,
            isTailored: false,
          }),
        }),
        fetch('/api/generate/resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            resumeData,
            templateId: templateB,
            isTailored: false,
          }),
        }),
      ]);

      const dataA = await responseA.json().catch(() => ({}));
      const dataB = await responseB.json().catch(() => ({}));

      if (!responseA.ok) {
        throw new Error(dataA.error || 'Failed to generate template A');
      }
      if (!responseB.ok) {
        throw new Error(dataB.error || 'Failed to generate template B');
      }

      setGeneratedPDFs({
        a: dataA.pdf,
        b: dataB.pdf,
        fileNameA: dataA.fileName,
        fileNameB: dataB.fileName,
      });
    } catch (error) {
      console.error('Error generating comparison:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to generate template comparison. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (base64: string, fileName: string) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    downloadBlob(blob, fileName);
  };

  const viewPDF = (base64: string) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const templateConfigA = builtInTemplates.find((t) => t.id === templateA);
  const templateConfigB = builtInTemplates.find((t) => t.id === templateB);
  const customConfigA = customTemplateMap.get(templateA);
  const customConfigB = customTemplateMap.get(templateB);

  const templateLabelA = templateConfigA?.name || customConfigA?.name || templateA;
  const templateLabelB = templateConfigB?.name || customConfigB?.name || templateB;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">A/B Template Comparison</h1>
        <p className="text-muted-foreground mt-2">
          Compare two resume templates side-by-side to see which one works best for you
        </p>
      </div>

      {/* Template Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template A</CardTitle>
            <CardDescription>Select first template to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={templateA}
              onChange={(e) => {
                setTemplateA(e.target.value as TemplateId);
                clearResults();
              }}
              className="w-full p-2 border rounded-md"
            >
              <optgroup label="Built-in">
                {builtInTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom">
                {customTemplates.map((template) => (
                  <option key={template.id} value={`custom-${template.id}`}>
                    {template.name} (Custom {template.type.toUpperCase()})
                  </option>
                ))}
              </optgroup>
            </select>
            {customLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <LoadingSpinner size="sm" />
                Loading custom templates…
              </div>
            )}
            {templateConfigA && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: templateConfigA.colors.primary }}
                  />
                  <span className="text-sm">{templateConfigA.layout} layout</span>
                </div>
                <p className="text-sm text-muted-foreground">{templateConfigA.description}</p>
                <p className="text-xs text-muted-foreground">
                  Category: {templateConfigA.category}
                </p>
              </div>
            )}
            {customConfigA && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Custom template • {customConfigA.type.toUpperCase()}
                </p>
                {customConfigA.type === 'pdf' && (
                  <p className="text-xs text-muted-foreground">
                    PDF custom templates must be fillable PDF forms to work for generation.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template B</CardTitle>
            <CardDescription>Select second template to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={templateB}
              onChange={(e) => {
                setTemplateB(e.target.value as TemplateId);
                clearResults();
              }}
              className="w-full p-2 border rounded-md"
            >
              <optgroup label="Built-in">
                {builtInTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom">
                {customTemplates.map((template) => (
                  <option key={template.id} value={`custom-${template.id}`}>
                    {template.name} (Custom {template.type.toUpperCase()})
                  </option>
                ))}
              </optgroup>
            </select>
            {customLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <LoadingSpinner size="sm" />
                Loading custom templates…
              </div>
            )}
            {templateConfigB && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: templateConfigB.colors.primary }}
                  />
                  <span className="text-sm">{templateConfigB.layout} layout</span>
                </div>
                <p className="text-sm text-muted-foreground">{templateConfigB.description}</p>
                <p className="text-xs text-muted-foreground">
                  Category: {templateConfigB.category}
                </p>
              </div>
            )}
            {customConfigB && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Custom template • {customConfigB.type.toUpperCase()}
                </p>
                {customConfigB.type === 'pdf' && (
                  <p className="text-xs text-muted-foreground">
                    PDF custom templates must be fillable PDF forms to work for generation.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={generateComparison}
          disabled={loading || resumeLoading || !resumeData}
          size="lg"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Generating Comparison...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Comparison
            </>
          )}
        </Button>
      </div>
      {!resumeLoading && !resumeData && (
        <p className="text-center text-sm text-muted-foreground">
          No saved resume data found. Save your resume first in{' '}
          <a className="underline" href="/edit-resume">
            Edit Resume
          </a>
          .
        </p>
      )}

      {/* Comparison Results */}
      {generatedPDFs.a && generatedPDFs.b && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{templateLabelA}</CardTitle>
              <CardDescription>Template A Preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[8.5/11] border rounded-lg bg-muted flex items-center justify-center">
                <iframe
                  src={`data:application/pdf;base64,${generatedPDFs.a}`}
                  className="w-full h-full rounded-lg"
                  title="Template A Preview"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => viewPDF(generatedPDFs.a!)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Full
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    downloadPDF(
                      generatedPDFs.a!,
                      generatedPDFs.fileNameA || `resume_${String(templateA)}.pdf`
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{templateLabelB}</CardTitle>
              <CardDescription>Template B Preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[8.5/11] border rounded-lg bg-muted flex items-center justify-center">
                <iframe
                  src={`data:application/pdf;base64,${generatedPDFs.b}`}
                  className="w-full h-full rounded-lg"
                  title="Template B Preview"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => viewPDF(generatedPDFs.b!)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Full
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    downloadPDF(
                      generatedPDFs.b!,
                      generatedPDFs.fileNameB || `resume_${String(templateB)}.pdf`
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Choosing the Best Template</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
            <li>Consider the industry you&apos;re applying to - creative fields may appreciate modern designs</li>
            <li>Traditional industries (finance, law) often prefer classic, conservative layouts</li>
            <li>Ensure your most important information stands out in the chosen layout</li>
            <li>Test readability - can you quickly find key details in 6 seconds?</li>
            <li>Check ATS compatibility - simpler layouts often perform better in ATS systems</li>
            <li>Get feedback from peers or mentors on which template presents you better</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
