import { NextRequest, NextResponse } from 'next/server';
import {
  createCustomTemplate,
  getUserCustomTemplates,
  deleteCustomTemplate,
  CustomTemplate,
} from '@/lib/firebase/db-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const templates = await getUserCustomTemplates(userId);
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Error fetching custom templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'html' | 'pdf';
    const file = formData.get('file') as File;

    if (!userId || !name || !type || !file) {
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
      userId,
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
    return NextResponse.json(
      { error: error.message || 'Failed to create custom template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await deleteCustomTemplate(templateId);
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting custom template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete custom template' },
      { status: 500 }
    );
  }
}
