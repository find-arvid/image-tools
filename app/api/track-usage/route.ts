import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Works with both Upstash and Vercel KV
// If using Vercel KV, it will auto-detect from environment variables
// If using Upstash, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

// Check for environment variables in order of preference
// Upstash uses: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Vercel KV uses: KV_REST_API_URL, KV_REST_API_TOKEN
// Some Redis providers might use: REDIS_URL, REDIS_TOKEN or custom prefixes
const redisUrl = process.env.UPSTASH_REDIS_REST_URL 
  || process.env.KV_REST_API_URL
  || process.env.REDIS_URL
  || process.env.STORAGE_URL; // Vercel sometimes uses STORAGE prefix

const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  || process.env.KV_REST_API_TOKEN
  || process.env.REDIS_TOKEN
  || process.env.STORAGE_TOKEN; // Vercel sometimes uses STORAGE prefix

// Initialize Redis only if credentials are available
const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// Log available environment variables for debugging (only in development)
if (process.env.NODE_ENV === 'development' && !redis) {
  console.log('Available Redis-related env vars:', {
    hasUPSTASH_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    hasUPSTASH_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    hasKV_URL: !!process.env.KV_REST_API_URL,
    hasKV_TOKEN: !!process.env.KV_REST_API_TOKEN,
    hasREDIS_URL: !!process.env.REDIS_URL,
    hasREDIS_TOKEN: !!process.env.REDIS_TOKEN,
    hasSTORAGE_URL: !!process.env.STORAGE_URL,
    hasSTORAGE_TOKEN: !!process.env.STORAGE_TOKEN,
  });
}

type ToolName = 'webo-news-overlay' | 'ccn-image-optimiser';

export async function POST(request: NextRequest) {
  try {
    // Check if Redis is configured
    if (!redis) {
      console.error('Redis not configured. Missing UPSTASH_REDIS_REST_URL or KV_REST_API_URL environment variables.');
      return NextResponse.json(
        { error: 'Redis not configured', details: 'Missing environment variables' },
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

    // Increment counter in Redis (works with both Upstash and Vercel KV)
    const count = await redis.incr(`usage:${tool}`);

    console.log(`Tracked usage for ${tool}: ${count}`);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if Redis is configured
    if (!redis) {
      console.error('Redis not configured. Missing UPSTASH_REDIS_REST_URL or KV_REST_API_URL environment variables.');
      return NextResponse.json({
        'webo-news-overlay': 0,
        'ccn-image-optimiser': 0,
        error: 'Redis not configured',
      });
    }

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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

