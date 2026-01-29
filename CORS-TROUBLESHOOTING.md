# CORS Troubleshooting - Step by Step

## Verify CORS is Actually Configured

### Step 1: Check Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Click **R2** → Your bucket → **Settings** tab
3. Scroll to **"CORS Policy"** section
4. **What do you see?**
   - ✅ If you see JSON code with `"AllowedOrigins"` → CORS is configured
   - ❌ If you see "No CORS policy" or empty → CORS is NOT configured

### Step 2: Verify the CORS Configuration

**It should look EXACTLY like this:**

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

**Common mistakes:**
- ❌ Missing the outer `[` and `]` brackets
- ❌ Missing commas between properties
- ❌ Using single quotes `'` instead of double quotes `"`
- ❌ Extra spaces or formatting issues

### Step 3: Test CORS Directly in Browser

1. Open your browser's Developer Console (F12)
2. Go to the **Network** tab
3. Try loading an image from your site
4. Click on a failed request (it will be red)
5. Look at the **Response Headers** - you should see:
   ```
   Access-Control-Allow-Origin: *
   ```
   or
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   ```

**If you DON'T see these headers → CORS is not configured correctly**

## Common Issues and Fixes

### Issue 1: CORS Configuration Not Saved

**Symptom:** You pasted the code but it's not working

**Fix:**
1. Make sure you clicked **"Save"** or **"Update"** button
2. Wait 30-60 seconds after saving
3. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear browser cache completely

### Issue 2: Browser Cache

**Symptom:** CORS is configured but still getting errors

**Fix:**
1. **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear cache completely:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content
3. **Try incognito/private window** - this bypasses cache

### Issue 3: CORS Takes Time to Propagate

**Symptom:** Just saved CORS but errors persist

**Fix:**
- Wait 1-2 minutes after saving
- Cloudflare needs time to propagate CORS settings globally
- Try again after waiting

### Issue 4: Wrong JSON Format

**Symptom:** Error when saving CORS policy

**Fix:**
- Copy the EXACT code from the guide (including all brackets and commas)
- Make sure there are no extra characters
- Validate JSON at https://jsonlint.com before pasting

## Quick Test: Verify CORS is Working

### Test 1: Check Response Headers

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Reload your page
4. Find a request to `pub-xxxxx.r2.dev` (your R2 domain)
5. Click on it
6. Check **Response Headers** section
7. Look for `Access-Control-Allow-Origin`

**If present:** ✅ CORS is working
**If missing:** ❌ CORS is not configured

### Test 2: Try Loading Image Directly

1. Copy a foreground image URL from your console error
2. Open it in a new browser tab
3. If it loads → Image exists
4. Go back to your app and check Network tab for CORS headers

## Still Not Working?

### Double-Check These:

1. ✅ **CORS is saved** in Cloudflare Dashboard
2. ✅ **JSON format is correct** (validated at jsonlint.com)
3. ✅ **Browser cache cleared** (hard refresh + incognito)
4. ✅ **Waited 1-2 minutes** after saving CORS
5. ✅ **Response headers show** `Access-Control-Allow-Origin`

### If All Above Are True:

The issue might be:
- **Different R2 bucket** - Make sure you configured CORS on the correct bucket
- **Custom domain** - If using a custom domain, CORS might need to be configured differently
- **Browser extension** - Try disabling browser extensions (ad blockers, privacy tools)

## Need More Help?

Share with me:
1. Screenshot of your CORS Policy in Cloudflare Dashboard
2. Screenshot of Network tab showing the failed request and its Response Headers
3. The exact error message from console
