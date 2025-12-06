import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Works with both Upstash and Vercel KV
// If using Vercel KV, it will auto-detect from environment variables
// If using Upstash, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN!,
});

type ToolName = 'webo-news-overlay' | 'ccn-image-optimiser';

export async function POST(request: NextRequest) {
  try {
    const { tool } = await request.json();

    if (!tool || !['webo-news-overlay', 'ccn-image-optimiser'].includes(tool)) {
      return NextResponse.json(
        { error: 'Invalid tool name' },
        { status: 400 }
      );
    }

    // Increment counter in Redis (works with both Upstash and Vercel KV)
    const count = await redis.incr(`usage:${tool}`);

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch usage counts from Redis
    const [weboCount, ccnCount] = await Promise.all([
      redis.get<number>('usage:webo-news-overlay'),
      redis.get<number>('usage:ccn-image-optimiser'),
    ]);

    return NextResponse.json({
      'webo-news-overlay': typeof weboCount === 'number' ? weboCount : 0,
      'ccn-image-optimiser': typeof ccnCount === 'number' ? ccnCount : 0,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({
      'webo-news-overlay': 0,
      'ccn-image-optimiser': 0,
    });
  }
}

