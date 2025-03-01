import { NextResponse } from 'next/server';
import { getCandidateIndex } from '@/lib/pinecone';
import { getEmbedding } from '@/lib/embedding';
import { Candidate } from '@/lib/types';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const candidate: Candidate = await request.json();
    
    // Get embedding for the resume text
    const embedding = await getEmbedding(candidate.resume_text);
    
    // Get Pinecone index
    const candidateIndex = getCandidateIndex();
    
    // Upsert the candidate data
    await candidateIndex.upsert([
      {
        id: candidate.email,
        values: embedding,
        metadata: {
          name: candidate.name,
          email: candidate.email,
          linkedin_url: candidate.linkedin_url,
          skill_experience: candidate.skills_experience,
        },
      }
    ]);
    
    return NextResponse.json({ message: 'Candidate stored successfully' });
  } catch (error) {
    console.error('Error storing candidate:', error);
    return NextResponse.json(
      { error: 'Failed to store candidate' },
      { status: 500 }
    );
  }
}