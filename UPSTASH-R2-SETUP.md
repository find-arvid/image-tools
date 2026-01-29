# Upstash R2 + Redis Setup Guide

## Step 1: Set Up Cloudflare R2 (S3-Compatible Storage)

Since Upstash doesn't have its own R2 service, we'll use **Cloudflare R2** which is S3-compatible and very cost-effective. You can use the same AWS SDK we installed.

### 1.1 Create Cloudflare Account (if you don't have one)
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for a free account

### 1.2 Create R2 Bucket
1. In Cloudflare Dashboard, go to **R2** → **Create bucket**
2. Name it: `youtube-thumbnail-images` (or your preferred name)
3. Choose a location close to your users
4. Click **Create bucket**

### 1.3 Get R2 API Credentials
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions:
   - **Object Read & Write** (for uploads)
   - **Bucket:** Select your bucket
4. Copy these values (you'll need them):
   - **Account ID** (found in R2 dashboard URL or sidebar)
   - **Access Key ID**
   - **Secret Access Key**

### 1.4 Get R2 Public URL (for serving images)
1. In your bucket, go to **Settings** → **Public Access**
2. Enable **Public Access** (or use a custom domain)
3. Copy the **Public URL** (format: `https://pub-xxxxx.r2.dev`)

## Step 2: Configure Environment Variables

Add these to your `.env.local` file (and Netlify environment variables):

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=youtube-thumbnail-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Upstash Redis (you already have these)
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token
```

## Step 3: Netlify Environment Variables

1. Go to your Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Add all the variables from Step 2
4. Make sure to mark `R2_SECRET_ACCESS_KEY` and `KV_REST_API_TOKEN` as **"Contains secret values"**

## Step 4: Test the Setup

Once you've added the environment variables, the API routes will be ready to use!

## Architecture Overview

- **Cloudflare R2**: Stores image files (PNG, WebP, etc.)
- **Upstash Redis**: Stores metadata (image IDs, emotion tags, uploader info, timestamps)
- **API Routes**: Handle uploads and fetching
- **Admin Page**: Interface for designers to upload and tag images

## Cost Estimate

- **Cloudflare R2**: 
  - Storage: $0.015/GB/month (first 10GB free)
  - Egress: Free (unlimited)
  - Operations: $4.50/million Class A (writes), $0.36/million Class B (reads)
  
- **Upstash Redis**: 
  - You're already using this for usage tracking
  - Pay per request (very affordable)

**Total for small-medium usage**: ~$5-10/month
