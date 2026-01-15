import type { NextRequest } from 'next/server';

export class RequestSizeError extends Error {
  status: number;

  constructor(message: string, status: number = 413) {
    super(message);
    this.name = 'RequestSizeError';
    this.status = status;
  }
}

export function enforceMaxBodySize(request: NextRequest, maxBytes: number): void {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return;

  const bytes = parseInt(contentLength, 10);
  if (!Number.isFinite(bytes)) return;

  if (bytes > maxBytes) {
    throw new RequestSizeError(`Request body too large (max ${maxBytes} bytes)`, 413);
  }
}

