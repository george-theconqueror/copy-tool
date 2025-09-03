import { NextRequest, NextResponse } from 'next/server';
import { analyzeFileWithAI } from '../../../repository/drive';

export async function POST(request: NextRequest) {
  try {
    const { fileId, prompt } = await request.json();

    if (!fileId || !prompt) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'Both fileId and prompt are required'
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          details: 'Please check OPENAI_API_KEY environment variable'
        },
        { status: 500 }
      );
    }

    const result = await analyzeFileWithAI(fileId, prompt);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { 
          error: 'Analysis failed',
          details: result.error || 'Unknown error occurred'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('File analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze file',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
