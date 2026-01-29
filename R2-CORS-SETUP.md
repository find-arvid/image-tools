# Cloudflare R2 CORS Configuration Guide

## Why CORS is Needed

When loading images from Cloudflare R2 into a canvas element in your browser, you need CORS (Cross-Origin Resource Sharing) configured. Without it, the browser blocks the image loading, causing the error you're seeing.

## Step-by-Step: Configure CORS on Cloudflare R2

### Step 1: Access Your R2 Bucket Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** → Select your bucket (`youtube-thumbnail-images` or your bucket name)
3. Click on **Settings** tab
4. Scroll down to find **CORS Policy** section

### Step 2: Add CORS Policy

Click **"Add CORS policy"** or **"Edit CORS policy"** and configure it as follows:

#### Option A: Allow All Origins (Development - Less Secure)

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

#### Option B: Specific Origins (Production - Recommended)

Replace `YOUR_DOMAIN` with your actual domain(s):

**For Local Development:**
- `http://localhost:3000`
- `http://localhost:3001` (if you use a different port)

**For Production (Netlify):**
- Your Netlify domain (e.g., `https://delightful-zabaione-42686e.netlify.app`)
- Your custom domain if you have one (e.g., `https://yourdomain.com`)

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://delightful-zabaione-42686e.netlify.app",
      "https://yourdomain.com"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Save the Configuration

1. Paste the JSON configuration into the CORS policy editor
2. Click **Save** or **Update**
3. Wait a few seconds for the changes to propagate

### Step 4: Test

1. **Restart your Next.js dev server** (if running locally)
2. Try uploading and viewing an image again
3. The CORS error should be resolved

## Configuration Explanation

- **AllowedOrigins**: Domains that can access your R2 bucket. Use `*` for development (allows all), or specific domains for production.
- **AllowedMethods**: HTTP methods allowed. `GET` and `HEAD` are sufficient for reading images.
- **AllowedHeaders**: Headers your client can send. `*` allows all headers.
- **ExposeHeaders**: Headers the browser can read from the response. `ETag` is useful for caching.
- **MaxAgeSeconds**: How long browsers cache the CORS preflight response (3600 = 1 hour).

## Troubleshooting

### Still Getting CORS Errors?

1. **Clear browser cache** - CORS settings are cached by browsers
2. **Hard refresh** - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. **Check the exact domain** - Make sure your domain matches exactly (including `http://` vs `https://`, port numbers, trailing slashes)
4. **Wait a few minutes** - CORS changes can take 1-2 minutes to propagate

### For Production (Netlify)

Make sure to include your Netlify domain in the `AllowedOrigins` array. You can find your Netlify domain in:
- Netlify Dashboard → Your Site → **Domain settings**
- It will be something like: `https://your-site-name.netlify.app`

## Quick Reference

**Minimum CORS Configuration for Image Loading:**
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

This minimal config will work for loading images into canvas elements.
