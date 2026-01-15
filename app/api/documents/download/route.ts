import { NextRequest, NextResponse } from 'next/server';
import { getCustomTemplate, getDocument } from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { generateTemplatedResumePDF } from '@/lib/pdf/template-renderer';
import { renderCustomTemplate } from '@/lib/pdf/custom-template-renderer';
import { generateCoverLetterPDF, cleanCoverLetterContent } from '@/lib/pdf/cover-letter-generator';
import { getAIProvider } from '@/lib/ai/provider';
import { buildCoverLetterPrompt } from '@/lib/gemini/prompts';
import type { BuiltInTemplateId } from '@/types';

function getDisposition(param: string | null): 'inline' | 'attachment' {
  return param === 'inline' ? 'inline' : 'attachment';
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const disposition = getDisposition(searchParams.get('disposition'));

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId parameter' }, { status: 400 });
    }

    const document = await getDocument(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileName = document.fileName || `document_${documentId}.pdf`;

    let pdfBuffer: Buffer;

    if (document.type === 'resume') {
      const templateId = document.templateId || 'modern';

      if (templateId.startsWith('custom-')) {
        const customTemplateId = templateId.replace('custom-', '');
        const customTemplate = await getCustomTemplate(customTemplateId);

        if (!customTemplate || customTemplate.userId !== uid) {
          return NextResponse.json({ error: 'Custom template not found' }, { status: 404 });
        }

        pdfBuffer = await renderCustomTemplate(document.data, customTemplate);
      } else {
        pdfBuffer = await generateTemplatedResumePDF(document.data, templateId as BuiltInTemplateId);
      }
    } else if (document.type === 'cover_letter') {
      let content = typeof document.content === 'string' ? document.content.trim() : '';

      if (!content) {
        if (!document.jobDescription) {
          return NextResponse.json(
            { error: 'Cover letter content is missing and cannot be regenerated without a job description.' },
            { status: 422 }
          );
        }

        const aiProvider = getAIProvider();
        const prompt = buildCoverLetterPrompt(JSON.stringify(document.data), document.jobDescription);
        const result = await aiProvider.generateContent(prompt);
        content = cleanCoverLetterContent(result.text);
      }

      pdfBuffer = await generateCoverLetterPDF(content);
    } else {
      return NextResponse.json({ error: 'Unsupported document type' }, { status: 400 });
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${fileName}"`,
        'X-Document-File-Name': fileName,
      },
    });
  } catch (error: any) {
    console.error('Error generating document PDF:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate document PDF' },
      { status: 500 }
    );
  }
}
