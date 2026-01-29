/**
 * Cloudflare R2 (S3-compatible) client configuration
 * Uses AWS SDK v3 for S3-compatible storage
 */

import { S3Client } from '@aws-sdk/client-s3';

// Get R2 configuration from environment variables
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'youtube-thumbnail-images';
const publicUrl = process.env.R2_PUBLIC_URL;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn('R2 configuration incomplete. Some features may not work.');
}

// Create S3 client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 uses 'auto' region
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export const R2_BUCKET_NAME = bucketName;
export const R2_PUBLIC_URL = publicUrl || '';

/**
 * Generate public URL for an R2 object
 */
export function getR2PublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL not configured');
  }
  // Remove leading slash if present
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}
