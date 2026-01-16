import { NextRequest, NextResponse } from 'next/server';
import { getCustomTemplate } from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { sanitizeFileNamePart } from '@/lib/utils/file-name';

function getDisposition(param: string | null): 'inline' | 'attachment' {
  return param === 'inline' ? 'inline' : 'attachment';
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');
    const disposition = getDisposition(searchParams.get('disposition'));

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

    const baseName = sanitizeFileNamePart(template.name || 'custom_template');
    const ext = template.type === 'pdf' ? 'pdf' : 'html';
    const fileName = `${baseName}.${ext}`;

    const buffer =
      template.type === 'pdf'
        ? Buffer.from(template.content, 'base64')
        : Buffer.from(template.content, 'base64');

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': template.type === 'pdf' ? 'application/pdf' : 'text/html; charset=utf-8',
        'Content-Disposition': `${disposition}; filename="${fileName}"`,
        'X-Template-File-Name': fileName,
      },
    });
  } catch (error: any) {
    console.error('Error downloading custom template:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to download custom template' },
      { status: 500 }
    );
  }
}

