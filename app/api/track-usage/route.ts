import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

// Works with standard Redis (redis://) connection strings
// Uses REDIS_URL environment variable (standard Redis Cloud/Redislabs format)

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

// Helper function to get Redis client
async function getRedisClient() {
  if (!redisUrl) {
    console.error('Redis URL not configured');
    return null;
  }

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: false, // Don't auto-reconnect in serverless
      },
    });

    // Connect to Redis with timeout
    if (!client.isOpen) {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        ),
      ]);
    }

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

type ToolName = 'webo-news-overlay' | 'ccn-image-optimiser';

// Time saved per use in minutes
const TIME_SAVED_PER_USE: Record<ToolName, number> = {
  'webo-news-overlay': 10, // 10 minutes per use
  'ccn-image-optimiser': 0, // Not tracking yet
};

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    // Check if Redis URL is configured
    if (!redisUrl) {
      console.error('Redis not configured. Missing REDIS_URL environment variable.');
      return NextResponse.json(
        { error: 'Redis not configured', details: 'Missing REDIS_URL environment variable' },
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

    // Get Redis client and increment counter
    client = await getRedisClient();
    if (!client) {
      throw new Error('Failed to connect to Redis');
    }

    const count = await client.incr(`usage:${tool}`);

    // Track time saved if applicable
    const timeSavedPerUse = TIME_SAVED_PER_USE[tool as ToolName];
    if (timeSavedPerUse > 0) {
      await client.incrBy(`time-saved:${tool}`, timeSavedPerUse);
    }

    console.log(`Tracked usage for ${tool}: ${count}${timeSavedPerUse > 0 ? `, time saved: ${timeSavedPerUse} minutes` : ''}`);
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
      await client.quit().catch(() => {});
    }
  }
}

export async function GET() {
  let client = null;

  try {
    // Check if Redis URL is configured
    if (!redisUrl) {
      console.error('Redis not configured. Missing REDIS_URL environment variable.');
      return NextResponse.json({
        'webo-news-overlay': 0,
        'ccn-image-optimiser': 0,
        timeSaved: {
          'webo-news-overlay': 0,
          'ccn-image-optimiser': 0,
        },
        error: 'Redis not configured',
      });
    }

    // Get Redis client and fetch counts
    client = await getRedisClient();
    if (!client) {
      throw new Error('Failed to connect to Redis');
    }

    const [weboCount, ccnCount, weboTimeSaved, ccnTimeSaved] = await Promise.all([
      client.get('usage:webo-news-overlay'),
      client.get('usage:ccn-image-optimiser'),
      client.get('time-saved:webo-news-overlay'),
      client.get('time-saved:ccn-image-optimiser'),
    ]);

    // Parse results (Redis returns strings, need to convert to numbers)
    const weboNum = weboCount ? parseInt(weboCount, 10) : 0;
    const ccnNum = ccnCount ? parseInt(ccnCount, 10) : 0;
    const weboTime = weboTimeSaved ? parseInt(weboTimeSaved, 10) : 0;
    const ccnTime = ccnTimeSaved ? parseInt(ccnTimeSaved, 10) : 0;

    return NextResponse.json({
      'webo-news-overlay': isNaN(weboNum) ? 0 : weboNum,
      'ccn-image-optimiser': isNaN(ccnNum) ? 0 : ccnNum,
      timeSaved: {
        'webo-news-overlay': isNaN(weboTime) ? 0 : weboTime,
        'ccn-image-optimiser': isNaN(ccnTime) ? 0 : ccnTime,
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({
      'webo-news-overlay': 0,
      'ccn-image-optimiser': 0,
      timeSaved: {
        'webo-news-overlay': 0,
        'ccn-image-optimiser': 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    // Close connection in serverless environment
    if (client && client.isOpen) {
      await client.quit().catch(() => {});
    }
  }
}
