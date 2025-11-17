'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading-spinner';
import { Download, Eye, RefreshCw } from 'lucide-react';
import { getAllTemplates } from '@/lib/templates/config';
import { ResumeData, TemplateId, ResumeTemplate } from '@/types';

export default function TemplateComparePage() {
  const [user] = useAuthState(auth!);
  const [loading, setLoading] = useState(false);
  const [templateA, setTemplateA] = useState<TemplateId>('modern');
  const [templateB, setTemplateB] = useState<TemplateId>('classic');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [generatedPDFs, setGeneratedPDFs] = useState<{
    a: string | null;
    b: string | null;
  }>({ a: null, b: null });

  const allTemplates = getAllTemplates();

  useEffect(() => {
    // Load saved resume data
    const loadResumeData = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/resume-data?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setResumeData(data.resumeData);
        }
      } catch (error) {
        console.error('Error loading resume data:', error);
      }
    };

    loadResumeData();
  }, [user]);

  const generateComparison = async () => {
    if (!user || !resumeData) {
      alert('Please save your resume data first in the Edit Resume page.');
      return;
    }

    setLoading(true);
    setGeneratedPDFs({ a: null, b: null });

    try {
      // Generate PDF for template A
      const responseA = await fetch('/api/generate/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: JSON.stringify(resumeData),
          userId: user.uid,
          templateId: templateA,
          isTailored: false,
        }),
      });

      if (!responseA.ok) throw new Error('Failed to generate template A');
      const dataA = await responseA.json();

      // Generate PDF for template B
      const responseB = await fetch('/api/generate/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: JSON.stringify(resumeData),
          userId: user.uid,
          templateId: templateB,
          isTailored: false,
        }),
      });

      if (!responseB.ok) throw new Error('Failed to generate template B');
      const dataB = await responseB.json();

      setGeneratedPDFs({
        a: dataA.pdf,
        b: dataB.pdf,
      });
    } catch (error) {
      console.error('Error generating comparison:', error);
      alert('Failed to generate template comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (base64: string, templateName: string) => {
    const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-${templateName}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewPDF = (base64: string) => {
    const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const templateConfigA = allTemplates.find((t) => t.id === templateA);
  const templateConfigB = allTemplates.find((t) => t.id === templateB);

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
              onChange={(e) => setTemplateA(e.target.value as TemplateId)}
              className="w-full p-2 border rounded-md"
            >
              {allTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
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
              onChange={(e) => setTemplateB(e.target.value as TemplateId)}
              className="w-full p-2 border rounded-md"
            >
              {allTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
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
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button onClick={generateComparison} disabled={loading || !resumeData} size="lg">
          {loading ? (
            <>
              <Loading text="" />
              <span className="ml-2">Generating Comparison...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Comparison
            </>
          )}
        </Button>
      </div>

      {/* Comparison Results */}
      {generatedPDFs.a && generatedPDFs.b && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{templateConfigA?.name}</CardTitle>
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
                  onClick={() => downloadPDF(generatedPDFs.a!, templateA)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{templateConfigB?.name}</CardTitle>
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
                  onClick={() => downloadPDF(generatedPDFs.b!, templateB)}
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
            <li>Consider the industry you're applying to - creative fields may appreciate modern designs</li>
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
