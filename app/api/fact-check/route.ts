import { NextRequest, NextResponse } from 'next/server';
import { checkFacts } from '../../lib/fact-checker';
import { FactCheckRequest, FactCheckResponse } from '../../lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: FactCheckRequest = await request.json();

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. Text is required.' },
        { status: 400 }
      );
    }

    if (body.text.length > 10000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 10,000 characters.' },
        { status: 400 }
      );
    }

    const factChecks = await checkFacts(body.text);

    const response: FactCheckResponse = {
      original_text: body.text,
      fact_checks: factChecks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process fact-check request.' },
      { status: 500 }
    );
  }
}
