# Simple CORS Setup - Step by Step

## What You Need To Do

You need to tell Cloudflare R2: "Allow my website to load images." This is called CORS.

## Exact Steps (Copy & Paste)

### Step 1: Open Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com
2. Log in if needed

### Step 2: Find Your R2 Bucket
1. In the left sidebar, click **"R2"**
2. You'll see a list of buckets - click on your bucket (probably named `youtube-thumbnail-images`)

### Step 3: Open Settings
1. At the top of the bucket page, you'll see tabs like: **Overview**, **Objects**, **Settings**
2. Click on **"Settings"** tab

### Step 4: Find CORS Section
1. Scroll down on the Settings page
2. Look for a section called **"CORS Policy"** or **"CORS"**
3. You might see a button that says **"Add CORS policy"** or **"Edit CORS policy"** - click it

### Step 5: Paste This Code

Copy this entire block and paste it into the text box:

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

**Important:** Copy everything from `[` to `]` including the brackets!

### Step 6: Save
1. Click the **"Save"** or **"Update"** button
2. Wait 10-20 seconds

### Step 7: Test
1. Go back to your website
2. Try uploading/viewing an image again
3. The error should be gone!

## Still Confused?

If you can't find the CORS section, here's what to look for:

- **Where:** Cloudflare Dashboard → R2 → Your Bucket → Settings tab
- **What to look for:** A text box or editor where you can paste JSON code
- **What it might say:** "CORS Policy", "CORS Configuration", or "Cross-Origin Resource Sharing"

## Can't Find It?

The CORS settings might be in a different location. Try:
1. Look for a **"Security"** or **"Permissions"** section
2. Check if there's a **"Public Access"** section - CORS might be there
3. Look for any button that says **"Edit"** or **"Configure"** near security settings

## What This Does

This code tells Cloudflare: "Allow ANY website to load images from this bucket." 
- The `"*"` means "all websites" (good for development)
- Later, you can change it to only allow your specific website

## Replace `*` with Your Specific Domains (For Production)

**Right now:** Use `*` to get it working quickly.

**Later (for security):** Replace `"*"` with your actual domains. Here's how:

### Step 1: Find Your Domains

You need to add:
1. **Local development:** `http://localhost:3000` (or whatever port you use)
2. **Your Netlify site:** Go to Netlify Dashboard → Your Site → Domain settings → Copy your domain (e.g., `https://delightful-zabaione-42686e.netlify.app`)

### Step 2: Replace the Code

Instead of this:
```json
"AllowedOrigins": ["*"],
```

Use this (replace with YOUR actual domains):
```json
"AllowedOrigins": [
  "http://localhost:3000",
  "https://your-netlify-site.netlify.app"
],
```

### Example: Full Code with Specific Domains

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://delightful-zabaione-42686e.netlify.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Important:** 
- Replace `delightful-zabaione-42686e.netlify.app` with YOUR actual Netlify domain
- Keep `http://localhost:3000` if you develop locally
- Add your custom domain if you have one (e.g., `https://yourdomain.com`)

### When to Do This?

- **Now:** Use `*` to fix the error quickly
- **Before going live:** Replace with specific domains for security

## Need Help?

If you're stuck, tell me:
1. What do you see when you go to R2 → Your Bucket → Settings?
2. Do you see a "CORS Policy" section?
3. What buttons/options do you see?
