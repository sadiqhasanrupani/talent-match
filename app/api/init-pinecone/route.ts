import { NextResponse } from 'next/server';
import { initPinecone } from '@/lib/pinecone';

export async function GET() {
  try {
    await initPinecone();
    return NextResponse.json({ message: 'Pinecone indexes initialized successfully' });
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Pinecone indexes' },
      { status: 500 }
    );
  }
}