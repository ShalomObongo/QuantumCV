import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { getCustomTemplate } from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId parameter' }, { status: 400 });
    }

    const template = await getCustomTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (template.type !== 'pdf') {
      return NextResponse.json({
        success: true,
        templateId,
        type: template.type,
        fillable: false,
        fields: [],
        message: 'Only PDF templates can be analyzed for fillable fields.',
      });
    }

    const bytes = Buffer.from(template.content, 'base64');
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields().map((f) => ({
      name: f.getName(),
      type: (f as any)?.constructor?.name || 'UnknownField',
    }));

    const fillable = fields.some((f) => f.type === 'PDFTextField');

    return NextResponse.json({
      success: true,
      templateId,
      type: template.type,
      fillable,
      fields,
    });
  } catch (error: any) {
    console.error('Error analyzing custom template:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to analyze custom template' },
      { status: 500 }
    );
  }
}
