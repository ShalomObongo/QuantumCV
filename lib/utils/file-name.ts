const MAX_PART_LENGTH = 40;

function trimTo(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
}

export function sanitizeFileNamePart(input: string): string {
  const normalized = input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\/\\?%*:|"<>]/g, '') // reserved characters across major OSes
    .replace(/[\u0000-\u001F]/g, ''); // control chars

  const safe = normalized
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return trimTo(safe || 'untitled', MAX_PART_LENGTH);
}

export function formatDateForFileName(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildDocumentFileName(params: {
  type: 'resume' | 'cover_letter';
  variant?: 'general' | 'tailored';
  candidateName?: string;
  jobTitle?: string;
  company?: string;
  createdAt?: Date;
}): string {
  const createdAt = params.createdAt ?? new Date();
  const date = formatDateForFileName(createdAt);
  const time = createdAt.getTime().toString().slice(-6);

  const typeLabel = params.type === 'cover_letter' ? 'Cover_Letter' : 'Resume';
  const variant = params.variant ? sanitizeFileNamePart(params.variant) : 'general';

  const candidate = sanitizeFileNamePart(params.candidateName || 'Candidate');

  const jobBits = [params.jobTitle, params.company].filter(Boolean) as string[];
  const job = jobBits.length > 0 ? sanitizeFileNamePart(jobBits.join(' ')) : 'General';

  return `${typeLabel}_${candidate}_${job}_${variant}_${date}_${time}.pdf`;
}

