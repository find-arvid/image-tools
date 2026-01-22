# Simple Netlify Environment Variable Setup

## Easy Method: Same Value for All Contexts

When creating environment variables in Netlify, use the simpler option:

### Steps:

1. **Key:** Enter `KV_REST_API_URL` (or `KV_REST_API_TOKEN`)

2. **Secret:** 
   - For `KV_REST_API_TOKEN`: ✅ Check "Contains secret values"
   - For `KV_REST_API_URL`: Leave unchecked (optional)

3. **Scopes:** Leave as "All scopes" (default)

4. **Values:** Select **"Same value for all deploy contexts"**
   - This is simpler! You only need to enter the value once.
   - Put your value in the single input field

5. Click **"Create variable"**

### Why "Same value for all deploy contexts"?

- ✅ **Simpler:** One value, works everywhere
- ✅ **Less confusing:** No need to fill multiple fields
- ✅ **Works fine:** Production, previews, and local dev all use the same value

### The Alternative (More Complex)

If you selected "Different value for each deploy context":
- You'd need to fill in multiple fields (Production, Deploy Previews, etc.)
- Only necessary if you want different values for different environments
- For your use case, **not needed!**

## Recommended Settings:

**Variable 1: `KV_REST_API_URL`**
- Secret: ❌ Unchecked
- Scopes: All scopes
- Values: **Same value for all deploy contexts**
- Value: `https://amazing-tortoise-34639.upstash.io`

**Variable 2: `KV_REST_API_TOKEN`**
- Secret: ✅ Checked
- Scopes: All scopes (or just "Functions" if you prefer)
- Values: **Same value for all deploy contexts**
- Value: `AYdPAAIncDIwZGQwNTVlNzcyZjc0YTU3OTkwNzE3NTA3NjJiNzM0MXAyMzQ2Mzk`

