'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { CustomTemplateMeta, TemplateId } from '@/types';
import { getAllTemplates } from '@/lib/templates/config';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/firebase/client-token';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const templates = getAllTemplates();
  const [user] = useAuthState(auth!);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateMeta[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!user) return;

      try {
        setCustomLoading(true);
        setCustomError(null);
        const response = await fetch('/api/custom-templates', {
          headers: await getAuthHeaders(user),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load custom templates');
        }
        setCustomTemplates(data.templates || []);
      } catch (err: any) {
        setCustomError(err.message || 'Failed to load custom templates');
        setCustomTemplates([]);
      } finally {
        setCustomLoading(false);
      }
    };

    loadCustomTemplates();
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a professional template that matches your style and industry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <Card
              key={template.id}
              className={`relative p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                isSelected
                  ? 'border-primary shadow-md'
                  : 'border-transparent hover:border-muted'
              }`}
              onClick={() => onSelectTemplate(template.id)}
            >
              {/* Template Preview */}
              <div className="aspect-[8.5/11] mb-3 rounded-lg overflow-hidden bg-muted relative">
                {/* Visual preview based on layout */}
                {template.layout === 'two-column' && (
                  <div className="h-full flex">
                    <div
                      className="w-2/3 p-2 space-y-1"
                      style={{ borderRight: `2px solid ${template.colors.primary}` }}
                    >
                      <div
                        className="h-3 w-3/4 rounded"
                        style={{ backgroundColor: template.colors.primary }}
                      />
                      <div className="h-1 w-full bg-gray-300 rounded" />
                      <div className="h-1 w-5/6 bg-gray-300 rounded" />
                      <div className="space-y-1 mt-2">
                        <div className="h-1 w-2/3 bg-gray-400 rounded" />
                        <div className="h-1 w-full bg-gray-200 rounded" />
                        <div className="h-1 w-4/5 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="w-1/3 p-2 space-y-1 bg-gray-50">
                      <div className="h-1 w-full bg-gray-400 rounded" />
                      <div className="h-1 w-3/4 bg-gray-300 rounded" />
                      <div className="h-1 w-full bg-gray-300 rounded" />
                    </div>
                  </div>
                )}

                {template.layout === 'single-column' && (
                  <div className="h-full p-2 space-y-1">
                    <div
                      className="h-3 w-1/2 mx-auto rounded"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div className="h-1 w-3/4 mx-auto bg-gray-300 rounded" />
                    <div
                      className="h-px w-full my-2"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div className="space-y-1">
                      <div className="h-1 w-1/3 bg-gray-400 rounded" />
                      <div className="h-1 w-full bg-gray-200 rounded" />
                      <div className="h-1 w-5/6 bg-gray-200 rounded" />
                      <div className="h-1 w-4/5 bg-gray-200 rounded" />
                    </div>
                  </div>
                )}

                {template.layout === 'timeline' && (
                  <div className="h-full p-2 space-y-2">
                    <div
                      className="h-3 w-1/2 rounded"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div className="flex gap-2 items-start">
                      <div className="flex flex-col items-center mt-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: template.colors.primary }}
                        />
                        <div
                          className="w-px h-8"
                          style={{ backgroundColor: template.colors.primary }}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1 w-1/3 bg-gray-400 rounded" />
                        <div className="h-1 w-2/3 bg-gray-300 rounded" />
                        <div className="h-1 w-full bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>

                {/* Color palette indicator */}
                <div className="flex gap-1 pt-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: template.colors.primary }}
                    title="Primary color"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: template.colors.secondary }}
                    title="Secondary color"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: template.colors.accent }}
                    title="Accent color"
                  />
                </div>

                {/* Layout badge */}
                <div className="pt-1">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {template.layout === 'two-column' && 'Two Column'}
                    {template.layout === 'single-column' && 'Single Column'}
                    {template.layout === 'timeline' && 'Timeline'}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Custom Templates</h4>
          {customLoading && <LoadingSpinner size="sm" />}
        </div>
        {customError && (
          <p className="text-xs text-destructive mt-1">{customError}</p>
        )}

        {customTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            No custom templates yet. Upload one in the Templates page.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {customTemplates.map((template) => {
              const templateId = `custom-${template.id}` as TemplateId;
              const isSelected = selectedTemplate === templateId;

              return (
                <Card
                  key={template.id}
                  className={`relative p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                    isSelected
                      ? 'border-primary shadow-md'
                      : 'border-transparent hover:border-muted'
                  }`}
                  onClick={() => onSelectTemplate(templateId)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}

                  <div className="aspect-[8.5/11] mb-3 rounded-lg overflow-hidden bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {template.type.toUpperCase()} Template
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Custom • {template.type.toUpperCase()}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
