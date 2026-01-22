# Netlify Environment Variables with Secrets

## Important: Netlify's Secret Behavior

When you check "Contains secret values", Netlify **requires** you to use "Different value for each deploy context". This is a security feature.

## Setup Instructions:

### Variable 1: `KV_REST_API_URL` (Not a Secret)

1. Key: `KV_REST_API_URL`
2. Secret: ❌ **Don't check** "Contains secret values"
3. Values: ✅ Select **"Same value for all deploy contexts"**
4. Value: `https://amazing-tortoise-34639.upstash.io`
5. Click "Create variable"

### Variable 2: `KV_REST_API_TOKEN` (Secret)

Since this is a secret, you'll need to fill in at least the Production field:

1. Key: `KV_REST_API_TOKEN`
2. Secret: ✅ **Check** "Contains secret values"
3. Values: Will auto-select "Different value for each deploy context"
4. Fill in at minimum:
   - **Production:** `AYdPAAIncDIwZGQwNTVlNzcyZjc0YTU3OTkwNzE3NTA3NjJiNzM0MXAyMzQ2Mzk`
   - **Deploy Previews:** (optional - can leave empty or copy Production value)
   - **Branch deploys:** (optional - can leave empty or copy Production value)
   - **Local development:** (optional - can leave empty or copy Production value)

5. Click "Create variable"

## Minimum Required:

You **only need to fill Production**. The others are optional for now. If you want them to work everywhere, copy the Production value to the other fields too.

## Why This Happens:

Netlify requires separate secret values per context for security - this prevents accidentally exposing secrets to wrong environments. For your use case, just filling Production is fine!

