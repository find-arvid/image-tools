import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check R2 and Redis configuration
 * Visit: http://localhost:3000/api/images/debug
 */
export async function GET() {
  const config = {
    r2: {
      hasAccountId: !!process.env.R2_ACCOUNT_ID,
      hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasBucketName: !!process.env.R2_BUCKET_NAME,
      hasPublicUrl: !!process.env.R2_PUBLIC_URL,
      accountId: process.env.R2_ACCOUNT_ID ? `${process.env.R2_ACCOUNT_ID.substring(0, 8)}...` : 'missing',
      bucketName: process.env.R2_BUCKET_NAME || 'missing',
      publicUrl: process.env.R2_PUBLIC_URL || 'missing',
    },
    redis: {
      hasUrl: !!process.env.KV_REST_API_URL,
      hasToken: !!process.env.KV_REST_API_TOKEN,
      url: process.env.KV_REST_API_URL ? `${process.env.KV_REST_API_URL.substring(0, 20)}...` : 'missing',
    },
  };

  return NextResponse.json(config, { status: 200 });
}
