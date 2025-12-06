import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

// Works with standard Redis (redis://) connection strings
// Uses REDIS_URL environment variable (standard Redis Cloud/Redislabs format)

// Helper function to get Redis URL (read from env at runtime, not module load time)
function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
}

// Helper function to get Redis client
async function getRedisClient() {
  const redisUrl = getRedisUrl();
  
  if (!redisUrl) {
    console.error('Redis URL not configured');
    return null;
  }

  try {
    // Redis Cloud typically requires TLS
    // If URL starts with redis:// but points to Redis Cloud, enable TLS
    let connectionUrl = redisUrl;
    if (redisUrl.startsWith('redis://') && redisUrl.includes('redislabs.com')) {
      // Convert to rediss:// for TLS
      connectionUrl = redisUrl.replace('redis://', 'rediss://');
    }

    const client = createClient({
      url: connectionUrl,
      socket: {
        reconnectStrategy: () => {
          // Don't reconnect in serverless - return error to stop retries
          return new Error('Reconnection disabled in serverless environment');
        },
      },
    });

    // Connect to Redis with timeout
    if (!client.isOpen) {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 10000)
        ),
      ]);
    }

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    console.error('Redis URL (masked):', redisUrl ? `${redisUrl.substring(0, 20)}...` : 'Not set');
    return null;
  }
}

type ToolName = 'webo-news-overlay' | 'ccn-image-optimiser';

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    // Check if Redis URL is configured (read at runtime)
    const redisUrl = getRedisUrl();
    if (!redisUrl) {
      console.error('Redis not configured. Missing REDIS_URL environment variable.');
      console.error('Environment check:', {
        hasREDIS_URL: !!process.env.REDIS_URL,
        REDIS_URL_length: process.env.REDIS_URL?.length || 0,
        hasUPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      });
      return NextResponse.json(
        { error: 'Redis not configured', details: 'Missing REDIS_URL environment variable' },
        { status: 500 }
      );
    }
    
    console.log('Redis URL configured, length:', redisUrl.length);

    const { tool } = await request.json();

    if (!tool || !['webo-news-overlay', 'ccn-image-optimiser'].includes(tool)) {
      return NextResponse.json(
        { error: 'Invalid tool name' },
        { status: 400 }
      );
    }

    // Get Redis client and increment counter
    client = await getRedisClient();
    if (!client) {
      console.error('Failed to get Redis client. Redis URL:', redisUrl ? 'Set' : 'Not set');
      throw new Error('Failed to connect to Redis');
    }

    const count = await client.incr(`usage:${tool}`);

    console.log(`Tracked usage for ${tool}: ${count}`);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    // Close connection in serverless environment
    if (client && client.isOpen) {
      try {
        await client.quit();
      } catch (closeError) {
        console.error('Error closing Redis connection:', closeError);
      }
    }
  }
}

export async function GET() {
  let client = null;

  try {
    // Check if Redis URL is configured (read at runtime)
    const redisUrl = getRedisUrl();
    if (!redisUrl) {
      console.error('Redis not configured. Missing REDIS_URL environment variable.');
      console.error('Environment check:', {
        hasREDIS_URL: !!process.env.REDIS_URL,
        REDIS_URL_length: process.env.REDIS_URL?.length || 0,
      });
      return NextResponse.json({
        'webo-news-overlay': 0,
        'ccn-image-optimiser': 0,
        error: 'Redis not configured',
      });
    }
    
    console.log('Redis URL configured for GET, length:', redisUrl.length);

    // Get Redis client and fetch counts
    client = await getRedisClient();
    if (!client) {
      throw new Error('Failed to connect to Redis');
    }

    const [weboCount, ccnCount] = await Promise.all([
      client.get('usage:webo-news-overlay'),
      client.get('usage:ccn-image-optimiser'),
    ]);

    // Parse results (Redis returns strings, need to convert to numbers)
    const weboNum = weboCount ? parseInt(weboCount, 10) : 0;
    const ccnNum = ccnCount ? parseInt(ccnCount, 10) : 0;

    return NextResponse.json({
      'webo-news-overlay': isNaN(weboNum) ? 0 : weboNum,
      'ccn-image-optimiser': isNaN(ccnNum) ? 0 : ccnNum,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({
      'webo-news-overlay': 0,
      'ccn-image-optimiser': 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    // Close connection in serverless environment
    if (client && client.isOpen) {
      await client.quit().catch(() => {});
    }
  }
}
