import { NextRequest, NextResponse } from 'next/server';
import { createJob, deleteJob, getJob, getUserJobs, updateJob } from '@/lib/firebase/db-utils';
import { AuthError, requireAuth } from '@/lib/firebase/server-auth';
import { enforceMaxBodySize, RequestSizeError } from '@/lib/server/request-size';
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  description: z.string().min(1),
  url: z.string().optional(),
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']).optional(),
});

const updateJobSchema = z.object({
  jobId: z.string().min(1),
  updates: z
    .object({
      title: z.string().optional(),
      company: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']).optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const job = await getJob(jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      if (job.userId !== uid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ job });
    }

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const jobs = await getUserJobs(uid, limit);
    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    enforceMaxBodySize(request, 512 * 1024);
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, company, description, url, status } = parsed.data;

    const normalizedStatus =
      status && typeof status === 'string' ? status : 'saved';

    const jobData: any = {
      userId: uid,
      title: title.trim(),
      description: description.trim(),
      status: ['saved', 'applied', 'interviewing', 'offer', 'rejected'].includes(normalizedStatus)
        ? normalizedStatus
        : 'saved',
    };

    if (typeof company === 'string' && company.trim()) {
      jobData.company = company.trim();
    }

    if (typeof url === 'string' && url.trim()) {
      jobData.url = url.trim();
    }

    const jobId = await createJob(jobData);

    return NextResponse.json({ success: true, jobId });
  } catch (error: any) {
    console.error('Error creating job:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message || 'Failed to create job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    enforceMaxBodySize(request, 512 * 1024);
    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { jobId, updates } = parsed.data;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (job.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const safeUpdates: any = {};

    if (updates && typeof updates === 'object') {
      if (typeof updates.title === 'string') safeUpdates.title = updates.title.trim();
      if (typeof updates.company === 'string') safeUpdates.company = updates.company.trim();
      if (typeof updates.description === 'string') safeUpdates.description = updates.description.trim();
      if (typeof updates.url === 'string') safeUpdates.url = updates.url.trim();
      if (typeof updates.status === 'string') {
        safeUpdates.status = ['saved', 'applied', 'interviewing', 'offer', 'rejected'].includes(updates.status)
          ? updates.status
          : job.status;
      }
    }

    await updateJob(jobId, safeUpdates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating job:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RequestSizeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message || 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteJob(jobId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message || 'Failed to delete job' }, { status: 500 });
  }
}
