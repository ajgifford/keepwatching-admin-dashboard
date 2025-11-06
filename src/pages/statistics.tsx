import { useEffect, useState } from 'react';

import { Alert, Box, Grid, Typography } from '@mui/material';

import {
  AccountHealthMetricsResponse,
  AccountHealthStats,
  AccountRankingStats,
  AccountRankingsResponse,
  ContentPopularityResponse,
  ContentPopularityStats,
  PlatformOverviewResponse,
  PlatformOverviewStats,
  PlatformTrendsResponse,
  PlatformTrendsStats,
  TrendingContentResponse,
  TrendingContentStats,
} from '@ajgifford/keepwatching-types';
import {
  AccountHealthCard,
  AccountRankingCard,
  ContentPopularityCard,
  ErrorComponent,
  LoadingComponent,
  PlatformOverviewCard,
  PlatformTrendsCard,
  TrendingContentCard,
} from '@ajgifford/keepwatching-ui';
import axios from 'axios';

interface StatisticsData {
  platformOverview: PlatformOverviewStats | null;
  accountHealth: AccountHealthStats | null;
  accountRanking: AccountRankingStats | null;
  contentPopularity: ContentPopularityStats | null;
  platformTrends: PlatformTrendsStats | null;
  trendingContent: TrendingContentStats | null;
}

export default function Statistics() {
  const [stats, setStats] = useState<StatisticsData>({
    platformOverview: null,
    accountHealth: null,
    accountRanking: null,
    contentPopularity: null,
    platformTrends: null,
    trendingContent: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partialFailure, setPartialFailure] = useState(false);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all statistics in parallel
        const [
          platformOverviewRes,
          accountHealthRes,
          accountRankingRes,
          contentPopularityRes,
          platformTrendsRes,
          trendingContentRes,
        ] = await Promise.allSettled([
          axios.get<PlatformOverviewResponse>('/api/v1/admin/statistics/platform/overview'),
          axios.get<AccountHealthMetricsResponse>('/api/v1/admin/statistics/accounts/health'),
          axios.get<AccountRankingsResponse>('/api/v1/admin/statistics/accounts/rankings'),
          axios.get<ContentPopularityResponse>('/api/v1/admin/statistics/content/popular'),
          axios.get<PlatformTrendsResponse>('/api/v1/admin/statistics/platform/trends'),
          axios.get<TrendingContentResponse>('/api/v1/admin/statistics/content/trending'),
        ]);

        // Check if all requests failed or if some failed
        const results = [
          platformOverviewRes,
          accountHealthRes,
          accountRankingRes,
          contentPopularityRes,
          platformTrendsRes,
          trendingContentRes,
        ];

        const allFailed = results.every((result) => result.status === 'rejected');
        const someFailed = results.some((result) => result.status === 'rejected');

        if (allFailed) {
          // If all requests failed, show error
          setError('Failed to load statistics');
          return;
        }

        // Set flag for partial failure warning
        setPartialFailure(someFailed && !allFailed);

        // Set stats, allowing partial success
        setStats({
          platformOverview: platformOverviewRes.status === 'fulfilled' ? platformOverviewRes.value.data.results : null,
          accountHealth: accountHealthRes.status === 'fulfilled' ? accountHealthRes.value.data.results : null,
          accountRanking: accountRankingRes.status === 'fulfilled' ? accountRankingRes.value.data.results : null,
          contentPopularity:
            contentPopularityRes.status === 'fulfilled' ? contentPopularityRes.value.data.results : null,
          platformTrends: platformTrendsRes.status === 'fulfilled' ? platformTrendsRes.value.data.results : null,
          trendingContent: trendingContentRes.status === 'fulfilled' ? trendingContentRes.value.data.results : null,
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
    // Refresh statistics every 5 minutes
    const interval = setInterval(fetchStatistics, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingComponent message="Loading Statistics..." />;
  }

  if (error) {
    return <ErrorComponent error={error} homeRoute="/" />;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Platform Statistics
      </Typography>

      {partialFailure && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some statistics failed to load. Displaying available data.
        </Alert>
      )}

      <Grid container spacing={3}>
        {stats.platformOverview && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <PlatformOverviewCard stats={stats.platformOverview} isLoading={false} />
          </Grid>
        )}

        {stats.accountHealth && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <AccountHealthCard stats={stats.accountHealth} isLoading={false} />
          </Grid>
        )}

        {stats.accountRanking && (
          <Grid size={12}>
            <AccountRankingCard stats={stats.accountRanking} isLoading={false} />
          </Grid>
        )}

        {stats.platformTrends && (
          <Grid size={12}>
            <PlatformTrendsCard stats={stats.platformTrends} isLoading={false} />
          </Grid>
        )}

        {stats.contentPopularity && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <ContentPopularityCard stats={stats.contentPopularity} isLoading={false} />
          </Grid>
        )}

        {stats.trendingContent && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <TrendingContentCard stats={stats.trendingContent} isLoading={false} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
