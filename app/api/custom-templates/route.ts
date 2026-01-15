import { NextRequest, NextResponse } from 'next/server';
import {
  createCustomTemplate,
  getUserCustomTemplates,
  deleteCustomTemplate,
  getCustomTemplate,
} from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const templates = await getUserCustomTemplates(uid);
    const templateMetas = templates.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      thumbnail: t.thumbnail,
      createdAt: t.createdAt,
    }));
    return NextResponse.json({ success: true, templates: templateMetas });
  } catch (error: any) {
    console.error('Error fetching custom templates:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'html' | 'pdf';
    const file = formData.get('file') as File;

    if (!name || !type || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const content = Buffer.from(arrayBuffer).toString('base64');

    // Create template
    const templateId = await createCustomTemplate({
      userId: uid,
      name,
      type,
      content,
    });

    return NextResponse.json({
      success: true,
      templateId,
      message: 'Custom template uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error creating custom template:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create custom template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await getCustomTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteCustomTemplate(templateId);
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting custom template:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete custom template' },
      { status: 500 }
    );
  }
}
