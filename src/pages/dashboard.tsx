import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Snackbar, Typography } from '@mui/material';

import {
  DatabaseHealthResponse,
  ServiceHealth,
  ServiceStatus,
  SiteStatus,
  SummaryCounts,
  SummaryCountsResponse,
} from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthResponse | null>(null);
  const [summaryCounts, setSummaryCounts] = useState<SummaryCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [restartingService, setRestartingService] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchDashboardData = async () => {
    try {
      const [healthResult, siteResult, dbResult, summaryResult] = await Promise.allSettled([
        axios.get('/api/v1/admin/health'),
        axios.get<SiteStatus>('/api/v1/admin/site-status'),
        axios.get<DatabaseHealthResponse>('/api/v1/admin/health/db'),
        axios.get<SummaryCountsResponse>('/api/v1/admin/summary-counts'),
      ]);

      if (healthResult.status === 'fulfilled') setServices(healthResult.value.data);
      if (siteResult.status === 'fulfilled') setSiteStatus(siteResult.value.data);
      if (dbResult.status === 'fulfilled') setDbHealth(dbResult.value.data);
      if (summaryResult.status === 'fulfilled') setSummaryCounts(summaryResult.value.data.counts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async (service: string) => {
    setRestartingService(service);
    try {
      const response = await axios.post(`/api/v1/admin/services/${service}/restart`);
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      setTimeout(fetchDashboardData, 2000);
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : 'Restart failed';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setRestartingService(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Summary
      </Typography>
      {summaryCounts && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.accounts}
              </Typography>
              <Typography color="text.secondary">Accounts</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.profiles}
              </Typography>
              <Typography color="text.secondary">Profiles</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.shows}
              </Typography>
              <Typography color="text.secondary">Shows</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.favoritedShows}
              </Typography>
              <Typography color="text.secondary">Favorited Shows</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.seasons}
              </Typography>
              <Typography color="text.secondary">Seasons</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.episodes}
              </Typography>
              <Typography color="text.secondary">Episodes</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.movies}
              </Typography>
              <Typography color="text.secondary">Movies</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.favoritedMovies}
              </Typography>
              <Typography color="text.secondary">Favorited Movies</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {summaryCounts.people}
              </Typography>
              <Typography color="text.secondary">People</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {siteStatus && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Site Status
          </Typography>
          <Paper
            sx={{
              p: 3,
              borderLeft: 6,
              borderColor: siteStatus.status === 'up' ? 'success.main' : 'error.main',
            }}
          >
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Chip
                label={siteStatus.status === 'up' ? 'UP' : 'DOWN'}
                color={siteStatus.status === 'up' ? 'success' : 'error'}
                sx={{ fontSize: '1rem', fontWeight: 'bold', px: 1 }}
              />
              <Typography variant="body1" color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
                {siteStatus.url}
              </Typography>
              {siteStatus.responseTimeMs !== null && (
                <Typography variant="body2" color="text.secondary">
                  {siteStatus.responseTimeMs} ms
                </Typography>
              )}
              {siteStatus.statusCode !== null && (
                <Typography variant="body2" color="text.secondary">
                  HTTP {siteStatus.statusCode}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Checked {new Date(siteStatus.lastChecked).toLocaleTimeString()}
              </Typography>
            </Box>
            {siteStatus.error && (
              <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                {siteStatus.error}
              </Typography>
            )}
          </Paper>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Services Health
          </Typography>
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid size={{ xs: 12, sm: 6 }} key={service.name}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    {service.name}
                  </Typography>
                  <Typography
                    component="p"
                    variant="h4"
                    sx={{
                      color:
                        service.status === ServiceStatus.RUNNING
                          ? 'success.main'
                          : service.status === ServiceStatus.ERROR
                            ? 'error.main'
                            : 'warning.main',
                    }}
                  >
                    {service.status.toUpperCase()}
                  </Typography>
                  <Typography color="text.secondary">Uptime: {service.uptime}</Typography>
                  <Typography color="text.secondary">Memory: {service.memory}</Typography>
                  <Typography color="text.secondary">CPU: {service.cpu}</Typography>
                  {(service.name === 'nginx' || service.name === 'pm2') && (
                    <Box sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color={service.status !== ServiceStatus.RUNNING ? 'error' : 'primary'}
                        disabled={restartingService === service.name}
                        startIcon={
                          restartingService === service.name ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : undefined
                        }
                        onClick={() => handleRestart(service.name)}
                      >
                        {restartingService === service.name ? 'Restarting…' : 'Restart'}
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Database Health
          </Typography>
          {dbHealth && (
            <Paper sx={{ p: 2 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Connection Pool Status
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: dbHealth.status === 'healthy' ? 'success.main' : 'error.main',
                  mb: 2,
                }}
              >
                {dbHealth.status.toUpperCase()}
              </Typography>
              <Typography color="text.secondary">Total Connections: {dbHealth.pool.totalConnections}</Typography>
              <Typography color="text.secondary">Active Connections: {dbHealth.pool.activeConnections}</Typography>
              <Typography color="text.secondary">Free Connections: {dbHealth.pool.freeConnections}</Typography>

              <Typography
                component="h3"
                variant="h6"
                color="primary"
                gutterBottom
                sx={{
                  mt: 3,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
                onClick={() => navigate('/dbHealth')}
              >
                Query Statistics (Top 5)
              </Typography>
              {dbHealth.queryStats.slice(0, 5).map((stat, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.primary" noWrap>
                    {stat.query}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Calls: {stat.count} | Avg: {stat.avgTime}ms | Max: {stat.maxTime}ms
                  </Typography>
                </Box>
              ))}
              {dbHealth.queryStats.length === 0 && (
                <Typography color="text.secondary">No query statistics available</Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
