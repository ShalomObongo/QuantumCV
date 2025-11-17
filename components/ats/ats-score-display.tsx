'use client';

import { ATSScore } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, CheckCircle2, TrendingUp, Target, FileCheck } from 'lucide-react';

interface ATSScoreDisplayProps {
  score: ATSScore;
  showDetails?: boolean;
}

export function ATSScoreDisplay({ score, showDetails = true }: ATSScoreDisplayProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (value: number) => {
    if (value >= 80) return 'bg-green-100 dark:bg-green-950';
    if (value >= 60) return 'bg-yellow-100 dark:bg-yellow-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 90) return 'Excellent';
    if (value >= 80) return 'Good';
    if (value >= 60) return 'Fair';
    if (value >= 40) return 'Needs Work';
    return 'Poor';
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const categoryIcons = {
    keywords: Target,
    formatting: FileCheck,
    structure: TrendingUp,
    skills: CheckCircle2,
    experience: TrendingUp,
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>ATS Score</span>
          </CardTitle>
          <CardDescription>
            How well your resume will perform in Applicant Tracking Systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div
              className={`flex items-center justify-center w-32 h-32 rounded-full ${getScoreBackground(score.overall)}`}
            >
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
                  {score.overall}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getScoreLabel(score.overall)}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                {score.overall >= 80
                  ? 'Your resume is well-optimized for ATS systems and should pass most automated filters.'
                  : score.overall >= 60
                  ? 'Your resume has good potential but could be improved for better ATS compatibility.'
                  : 'Your resume needs significant improvements to perform well in ATS systems.'}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Issues Found</div>
                  <div className="font-semibold">{score.issues.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Keywords Matched</div>
                  <div className="font-semibold">
                    {score.matchedKeywords.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <>
          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of each scoring category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(score.breakdown).map(([category, value]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm font-medium capitalize">
                            {category}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
                          {value}/100
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            value >= 80
                              ? 'bg-green-600'
                              : value >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {score.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Issues Detected</CardTitle>
                <CardDescription>
                  Problems that may affect your resume's ATS performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {score.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${
                        issue.severity === 'critical'
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : issue.severity === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-950/20'
                          : 'bg-blue-50 dark:bg-blue-950/20'
                      }`}
                    >
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">
                          {issue.category}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {issue.message}
                        </div>
                        {issue.suggestion && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            💡 {issue.suggestion}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {issue.severity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {score.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Actionable tips to improve your ATS score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {score.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Keywords */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            {score.matchedKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Matched Keywords</CardTitle>
                  <CardDescription>
                    Job description terms found in your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {score.matchedKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs rounded-md bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Missing Keywords */}
            {score.missingKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Missing Keywords</CardTitle>
                  <CardDescription>
                    Important terms to consider adding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {score.missingKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
