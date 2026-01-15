'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ContentSuggestion } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Lightbulb,
  TrendingUp,
  Plus,
  Tag,
  RefreshCw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/firebase/client-token';

interface SuggestionsPanelProps {
  content: string;
  contentType: 'summary' | 'experience' | 'skills' | 'general';
  jobDescription?: string;
  onApplySuggestion?: (suggestion: ContentSuggestion) => void;
}

export function SuggestionsPanel({
  content,
  contentType,
  jobDescription,
  onApplySuggestion,
}: SuggestionsPanelProps) {
  const [user] = useAuthState(auth!);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedContent, setLastFetchedContent] = useState('');

  // Debounced fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!content || content.trim().length < 20) {
      setSuggestions([]);
      return;
    }

    if (!user) {
      setSuggestions([]);
      setError('Sign in to get AI suggestions');
      return;
    }

    // Don't refetch if content hasn't changed significantly
    if (content === lastFetchedContent) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders(user)),
        },
        body: JSON.stringify({
          content,
          contentType,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      setSuggestions(data.suggestions || []);
      setLastFetchedContent(content);
    } catch (err: any) {
      setError(err.message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [content, contentType, jobDescription, lastFetchedContent, user]);

  // Auto-fetch on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && content.trim().length >= 20) {
        fetchSuggestions();
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [content, fetchSuggestions]);

  const getTypeIcon = (type: ContentSuggestion['type']) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="h-4 w-4" />;
      case 'addition':
        return <Plus className="h-4 w-4" />;
      case 'keyword':
        return <Tag className="h-4 w-4" />;
      case 'rephrasing':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: ContentSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeLabel = (type: ContentSuggestion['type']) => {
    switch (type) {
      case 'improvement':
        return 'Improvement';
      case 'addition':
        return 'Addition';
      case 'keyword':
        return 'Keyword';
      case 'rephrasing':
        return 'Rephrasing';
      default:
        return 'Suggestion';
    }
  };

  if (!content || content.trim().length < 20) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>AI Suggestions</span>
          </CardTitle>
          <CardDescription>
            Start typing (at least 20 characters) to get AI-powered suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Suggestions will appear here as you type</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>AI Suggestions</span>
            </CardTitle>
            <CardDescription>
              {suggestions.length > 0
                ? `${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''} to improve your ${contentType}`
                : 'AI-powered suggestions for your content'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading || content === lastFetchedContent}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">Analyzing content...</span>
          </div>
        ) : suggestions.length === 0 && lastFetchedContent ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No suggestions at the moment</p>
            <p className="text-sm mt-1">Your content looks good!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border transition-colors hover:shadow-sm ${getImpactColor(
                  suggestion.impact
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(suggestion.type)}
                    <span className="text-sm font-semibold">
                      {getTypeLabel(suggestion.type)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 capitalize">
                      {suggestion.impact} impact
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-current" />
                    <p className="text-sm font-medium flex-1">
                      {suggestion.suggestedText}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground pl-6">
                    {suggestion.reason}
                  </p>

                  {onApplySuggestion && (
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplySuggestion(suggestion)}
                        className="text-xs"
                      >
                        Apply Suggestion
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
