'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type UsageStats = {
  'webo-news-overlay': number;
  'ccn-image-optimiser': number;
  timeSaved?: {
    'webo-news-overlay': number;
    'ccn-image-optimiser': number;
  };
};

const toolNames: Record<keyof UsageStats, string> = {
  'webo-news-overlay': 'Webopedia News Overlay',
  'ccn-image-optimiser': 'CCN Image Optimiser',
};

// Helper function to format minutes into readable time
function formatTimeSaved(minutes: number): string {
  if (minutes === 0) return '0 minutes';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  } else if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  }
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<UsageStats>({
    'webo-news-overlay': 0,
    'ccn-image-optimiser': 0,
    timeSaved: {
      'webo-news-overlay': 0,
      'ccn-image-optimiser': 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/track-usage');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        console.log('Fetched stats data:', data); // Debug log
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalUsage = stats['webo-news-overlay'] + stats['ccn-image-optimiser'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tool Usage Statistics</h1>
          <p className="text-muted-foreground">
            Track how many times each tool has been used
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading statistics...</div>
        ) : error ? (
          <div className="text-center text-destructive">Error: {error}</div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalUsage.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2">Total images processed</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{toolNames['webo-news-overlay']}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats['webo-news-overlay'].toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {totalUsage > 0
                      ? `${Math.round((stats['webo-news-overlay'] / totalUsage) * 100)}% of total usage`
                      : 'No usage yet'}
                  </p>
                  {stats.timeSaved && typeof stats.timeSaved['webo-news-overlay'] === 'number' && (
                    <p className="text-sm font-medium text-green-400 mt-3">
                      ⏱️ Time saved: {formatTimeSaved(stats.timeSaved['webo-news-overlay'])}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    Tracking since {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{toolNames['ccn-image-optimiser']}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats['ccn-image-optimiser'].toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {totalUsage > 0
                      ? `${Math.round((stats['ccn-image-optimiser'] / totalUsage) * 100)}% of total usage`
                      : 'No usage yet'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    Tracking since {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

