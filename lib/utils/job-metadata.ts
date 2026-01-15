export function inferJobTitleFromDescription(jobDescription: unknown): string | undefined {
  if (typeof jobDescription !== 'string') return undefined;

  const firstNonEmptyLine =
    jobDescription
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) || '';

  if (!firstNonEmptyLine) return undefined;

  // Common prefixes in pasted JDs.
  const cleaned = firstNonEmptyLine
    .replace(/^(job\s*title|position|role)\s*:\s*/i, '')
    .trim();

  if (cleaned.length < 3) return undefined;
  if (cleaned.length > 80) return cleaned.slice(0, 80);
  return cleaned;
}

