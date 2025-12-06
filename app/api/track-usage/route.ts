import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Simple, reliable statistics tracking using Upstash Redis
// REST-based API - perfect for serverless, no connection management needed!

// Initialize Upstash Redis client
// Automatically uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

type ToolName = 'webo-news-overlay' | 'ccn-image-optimiser';

export async function POST(request: NextRequest) {
  try {
    // Check if Upstash is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Upstash Redis not configured');
      return NextResponse.json(
        { error: 'Redis not configured', details: 'Missing Upstash environment variables' },
        { status: 500 }
      );
    }

    const { tool } = await request.json();

    if (!tool || !['webo-news-overlay', 'ccn-image-optimiser'].includes(tool)) {
      return NextResponse.json(
        { error: 'Invalid tool name' },
        { status: 400 }
      );
    }

    // Increment counter using Upstash Redis
    // If key doesn't exist, it starts at 0, then increments to 1
    const count = await redis.incr(`usage:${tool}`);

    console.log(`Tracked usage for ${tool}: ${count}`);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to track usage', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if Upstash is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Upstash Redis not configured');
      return NextResponse.json({
        'webo-news-overlay': 0,
        'ccn-image-optimiser': 0,
        error: 'Redis not configured',
      });
    }

    // Fetch counts from Upstash Redis
    // Returns null if key doesn't exist, so we default to 0
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
