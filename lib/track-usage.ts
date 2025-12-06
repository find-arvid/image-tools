/**
 * Track tool usage by calling the API endpoint
 */
export async function trackToolUsage(tool: 'webo-news-overlay' | 'ccn-image-optimiser') {
  try {
    await fetch('/api/track-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool }),
    });
  } catch (error) {
    // Fail silently - we don't want to break the user experience if tracking fails
    console.error('Failed to track usage:', error);
  }
}

