import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Simple, reliable statistics tracking using Upstash Redis via Vercel KV
// REST-based API - perfect for serverless, no connection management needed!

type ToolName = 'webo-news-overlay' | 'ccn-image-optimiser';

// Helper function to get Upstash Redis client
// Vercel creates KV_REST_API_URL and KV_REST_API_TOKEN when connecting Upstash
function getRedisClient(): Redis | null {
  // Vercel creates these variables when you connect Upstash via marketplace
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // Debug logging to see what we have
  console.log('Environment check:', {
    hasKV_REST_API_URL: !!url,
    hasKV_REST_API_TOKEN: !!token,
    urlLength: url?.length || 0,
    tokenLength: token?.length || 0,
    allKVVars: Object.keys(process.env).filter(k => k.includes('KV') || k.includes('UPSTASH')),
  });

  if (!url || !token) {
    console.error('Upstash Redis not configured. Missing environment variables.');
    return null;
  }

  try {
    return new Redis({
      url,
      token,
    });
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis not configured', details: 'Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables' },
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
    const redis = getRedisClient();
    if (!redis) {
      console.error('Redis client is null - returning 0s');
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

    console.log('Fetched counts:', { weboCount, ccnCount });

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
