# Database Setup Guide - Step by Step

## ✅ What We've Built

1. **Cloudflare R2 Integration** - S3-compatible object storage for images
2. **Upstash Redis Integration** - Metadata storage (emotions, tags, etc.)
3. **API Routes** - Upload, fetch, and delete images
4. **Admin Interface** - `/admin/images` for designers to upload and tag images
5. **Updated Thumbnail Creator** - Now fetches images from database instead of static files

## 📋 Step-by-Step Setup Instructions

### Step 1: Set Up Cloudflare R2

1. **Create Cloudflare Account** (if needed)
   - Go to https://dash.cloudflare.com/sign-up
   - Sign up (free tier available)

2. **Create R2 Bucket**
   - In Cloudflare Dashboard → **R2** → **Create bucket**
   - Name: `youtube-thumbnail-images` (or your choice)
   - Choose location closest to your users
   - Click **Create bucket**

3. **Enable Public Access**
   - In your bucket → **Settings** → **Public Access**
   - Enable **Public Access**
   - Copy the **Public URL** (format: `https://pub-xxxxx.r2.dev`)

4. **Create API Token**
   - Go to **R2** → **Manage R2 API Tokens**
   - Click **Create API token**
   - Permissions: **Object Read & Write**
   - Bucket: Select your bucket
   - Copy these values:
     - **Account ID** (found in dashboard URL or sidebar)
     - **Access Key ID**
     - **Secret Access Key**

### Step 2: Configure Environment Variables

Add these to your `.env.local` file:

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

### Step 3: Add Environment Variables to Netlify

1. Go to your Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Add all variables from Step 2
4. **Important**: Mark these as **"Contains secret values"**:
   - `R2_SECRET_ACCESS_KEY`
   - `KV_REST_API_TOKEN`

### Step 4: Test Locally

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Test the admin page**:
   - Navigate to `http://localhost:3000/admin/images`
   - Try uploading an image with emotion tags
   - Check that it appears in the "Recently uploaded" section

3. **Test the thumbnail creator**:
   - Navigate to `http://localhost:3000/youtube-thumbnail`
   - Verify that uploaded images appear in the Vibe section
   - Try creating a thumbnail with a database image

### Step 5: Deploy to Netlify

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add image database with R2 and Redis"
   git push
   ```

2. **Netlify will auto-deploy** (if connected to Git)
   - Or manually trigger a deploy from Netlify dashboard

3. **Verify deployment**:
   - Check Netlify build logs for any errors
   - Test the admin page on production
   - Test the thumbnail creator on production

## 📁 File Structure

```
app/
  api/
    images/
      upload/route.ts      # POST /api/images/upload
      [id]/route.ts        # GET/DELETE /api/images/[id]
      route.ts              # GET /api/images
  admin/
    images/
      page.tsx             # Admin interface for uploading
  youtube-thumbnail/
    page.tsx               # Updated to fetch from database

lib/
  r2-client.ts            # R2/S3 client configuration
  image-database.ts       # Redis metadata functions
  fetch-images.ts         # API helpers for fetching images
```

## 🔧 How It Works

### Upload Flow
1. Designer uploads image via `/admin/images`
2. Image is uploaded to Cloudflare R2
3. Metadata (emotions, category, etc.) is saved to Upstash Redis
4. Image is immediately available in the thumbnail creator

### Fetch Flow
1. Thumbnail creator loads → calls `/api/images?type=foreground`
2. API queries Redis for image IDs by type
3. Returns metadata with public URLs
4. Images are displayed from R2 public URLs

### Search Flow
1. User searches for emotion (e.g., "excited")
2. API queries Redis: `images:emotion:excited`
3. Returns all images tagged with that emotion
4. Results displayed in the UI

## 🎯 Next Steps

1. **Upload your existing images**:
   - Go to `/admin/images`
   - Upload all your foreground and background images
   - Tag them with appropriate emotions

2. **Migrate from static files** (optional):
   - Once all images are in the database, you can remove static image files
   - The system falls back to static images if database is empty

3. **Add authentication** (recommended):
   - Protect `/admin/images` with authentication
   - Only allow designers to upload images

## 💰 Cost Estimate

- **Cloudflare R2**:
  - Storage: $0.015/GB/month (first 10GB free)
  - Egress: Free (unlimited)
  - Operations: Very affordable (~$5/month for moderate usage)

- **Upstash Redis**:
  - You're already using this
  - Pay per request (very affordable)

**Total**: ~$5-10/month for small-medium usage

## 🐛 Troubleshooting

### Images not appearing
- Check that R2 environment variables are set correctly
- Verify R2 bucket has public access enabled
- Check browser console for API errors

### Upload fails
- Verify all R2 credentials are correct
- Check that Redis is configured (KV_REST_API_URL/TOKEN)
- Check Netlify function logs for errors

### Images load slowly
- R2 public URLs are fast, but you can add a CDN
- Consider using Cloudflare's CDN (automatic with R2)

## 📚 API Endpoints

- `POST /api/images/upload` - Upload new image
- `GET /api/images` - List all images (with filters)
- `GET /api/images?type=foreground` - Get foregrounds only
- `GET /api/images?emotion=excited` - Get by emotion
- `GET /api/images?id=xxx` - Get specific image
- `DELETE /api/images/[id]` - Delete image

## ✅ Checklist

- [ ] Cloudflare R2 bucket created
- [ ] R2 public access enabled
- [ ] R2 API token created
- [ ] Environment variables added to `.env.local`
- [ ] Environment variables added to Netlify
- [ ] Tested admin upload locally
- [ ] Tested thumbnail creator locally
- [ ] Deployed to Netlify
- [ ] Tested on production

---

**Need help?** Check the setup guide in `UPSTASH-R2-SETUP.md` for more details.
