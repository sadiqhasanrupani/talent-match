import { NextResponse } from 'next/server';
import { getJobIndex } from '@/lib/pinecone';
import { getEmbedding } from '@/lib/embedding';
import { JobPosting } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const job: JobPosting = await request.json();
    
    // Get embedding for the job description
    const embedding = await getEmbedding(job.description);
    
    // Get Pinecone index
    const jobIndex = getJobIndex();
    
    // Upsert the job data
    await jobIndex.upsert([
      {
        id: job.job_id,
        values: embedding,
        metadata: {
          title: job.title,
          description: job.description,
        },
      }
    ]);
    
    return NextResponse.json({ message: 'Job stored successfully' });
  } catch (error) {
    console.error('Error storing job:', error);
    return NextResponse.json(
      { error: 'Failed to store job' },
      { status: 500 }
    );
  }
}