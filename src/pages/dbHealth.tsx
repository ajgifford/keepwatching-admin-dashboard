import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AssessmentIcon from '@mui/icons-material/Assessment';
import StorageIcon from '@mui/icons-material/Storage';
import { Box, Button, Card, CardContent, CircularProgress, Divider, Grid, Paper, Typography } from '@mui/material';

import {
  ArchiveLogEntry,
  DBQueryStats,
  DatabaseHealthResponse,
  QueryPerformanceOverview,
  SlowestQuery,
} from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function DBHealth() {
  const navigate = useNavigate();
  const [queryStats, setQueryStats] = useState<DBQueryStats[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthResponse | null>(null);
  const [performanceOverview, setPerformanceOverview] = useState<QueryPerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [queryStatsRes, dbHealthRes, performanceOverviewRes] = await Promise.all([
          axios.get('/api/v1/admin/health/db/query-stats'),
          axios.get('/api/v1/admin/health/db'),
          axios.get('/api/v1/admin/health/db/performance-overview?days=7'),
        ]);
        setQueryStats(queryStatsRes.data);
        setDbHealth(dbHealthRes.data);
        setPerformanceOverview(performanceOverviewRes.data);
      } catch (error) {
        console.error('Error fetching database health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  const handleQueryClick = (queryName: string) => {
    navigate(`/queryHistory?queryName=${encodeURIComponent(queryName)}`);
  };

  return (
    <Box>
      <Typography component="h1" variant="h5" color="primary" gutterBottom>
        Database Health & Performance
      </Typography>

      {/* Database Health Status */}
      {dbHealth && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <StorageIcon color="primary" />
              <Typography component="h2" variant="h6" color="primary">
                Database Connection Pool
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: dbHealth.status === 'healthy' ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {dbHealth.status.toUpperCase()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Connections
                </Typography>
                <Typography variant="h6">
                  {dbHealth.pool.activeConnections} / {dbHealth.pool.totalConnections}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Free Connections
                </Typography>
                <Typography variant="h6">{dbHealth.pool.freeConnections}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      {performanceOverview && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <AssessmentIcon color="primary" />
              <Typography component="h2" variant="h6" color="primary">
                Performance Overview (Last 7 Days)
              </Typography>
            </Box>

            {/* Real-time Stats */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Real-time Statistics
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Queries
                </Typography>
                <Typography variant="h6">{performanceOverview.realtime.queryStats.length}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Historical Stats */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Historical Statistics
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Queries
                </Typography>
                <Typography variant="h6">{performanceOverview.historical.statistics.totalQueries}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Executions
                </Typography>
                <Typography variant="h6">{performanceOverview.historical.statistics.totalExecutions}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Avg Duration
                </Typography>
                <Typography variant="h6">
                  {Number(performanceOverview.historical.statistics.avgDuration || 0).toFixed(2)}ms
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Slowest Query
                </Typography>
                <Typography variant="body2" noWrap>
                  {performanceOverview.historical.statistics.slowestQuery || 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Slowest Queries */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Top Slowest Queries
              </Typography>
              <Button variant="outlined" size="small" onClick={() => navigate('/slowestQueries')}>
                View All
              </Button>
            </Box>
            {performanceOverview.historical.slowestQueries.slice(0, 5).map((query: SlowestQuery, index: number) => (
              <Paper
                key={index}
                sx={{
                  mb: 1,
                  p: 1.5,
                }}
              >
                <Typography variant="body2" color="text.primary" noWrap>
                  {query.queryTemplate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg: {Number(query.avgDurationInMillis || 0).toFixed(2)}ms | Max: {Number(query.maxDurationInMillis || 0).toFixed(2)}ms | Calls:{' '}
                  {query.totalExecutions}
                </Typography>
              </Paper>
            ))}
            {performanceOverview.historical.slowestQueries.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No slow queries found
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Archive Logs */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Recent Archive Logs
              </Typography>
              <Button variant="outlined" size="small" onClick={() => navigate('/archiveLogs')}>
                View All
              </Button>
            </Box>
            {performanceOverview.historical.archiveLogs.map((log: ArchiveLogEntry, index: number) => (
              <Paper
                key={index}
                sx={{
                  mb: 1,
                  p: 1.5,
                }}
              >
                <Typography variant="body2" color="text.primary">
                  {new Date(log.archiveDate).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Metrics: {log.metricsArchived} | Queries: {log.queriesProcessed} | Status: {log.status}
                </Typography>
              </Paper>
            ))}
            {performanceOverview.historical.archiveLogs.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No archive logs available
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Query Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AssessmentIcon color="primary" />
            <Typography component="h2" variant="h6" color="primary">
              Query Statistics (Today)
            </Typography>
          </Box>
          {queryStats.map((stat, index) => (
            <Paper
              key={index}
              sx={{
                mb: 1,
                p: 1.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(4px)',
                },
              }}
              onClick={() => handleQueryClick(stat.query)}
            >
              <Typography variant="body2" color="text.primary" noWrap>
                {stat.query}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Calls: {stat.count} | Avg: {stat.avgTime}ms | Max: {stat.maxTime}ms
              </Typography>
            </Paper>
          ))}
          {queryStats.length === 0 && <Typography color="text.secondary">No query statistics available</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
}
