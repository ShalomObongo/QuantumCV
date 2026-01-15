'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { ResumeData } from '@/types';
import { auth } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/firebase/client-token';

interface ResumeUploaderProps {
  onDataExtracted: (data: ResumeData) => void;
  onError?: (error: string) => void;
}

export function ResumeUploader({ onDataExtracted, onError }: ResumeUploaderProps) {
  const [user] = useAuthState(auth!);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = ['text/plain', 'application/pdf'];
    const validExtensions = ['.txt', '.pdf'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a .txt or .pdf file');
      onError?.('Please upload a .txt or .pdf file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      onError?.('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleParse = async () => {
    if (!file) return;
    if (!user) {
      setError('You must be signed in to parse a resume');
      onError?.('You must be signed in to parse a resume');
      return;
    }

    try {
      setParsing(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-resume-file', {
        method: 'POST',
        headers: await getAuthHeaders(user),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      setSuccess(true);
      onDataExtracted(data.data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to parse resume';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Existing Resume</span>
        </CardTitle>
        <CardDescription>
          Upload your current resume to automatically extract and populate your information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {error && (
          <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md flex items-start space-x-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Resume parsed successfully! Your information has been extracted.</span>
          </div>
        )}

        {!file ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5'
            }`}
            onClick={handleBrowseClick}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragging ? 'Drop your resume here' : 'Drag and drop your resume'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <Button type="button" variant="outline" size="sm">
              Select File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: .txt, .pdf (max 5MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={parsing}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleParse}
              disabled={parsing}
              className="w-full"
              size="lg"
            >
              {parsing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Parsing Resume...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse Resume
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will use AI to extract structured data from your resume
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
