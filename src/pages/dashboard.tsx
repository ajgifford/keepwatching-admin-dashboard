import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';

import {
  DatabaseHealthResponse,
  ServiceHealth,
  ServiceStatus,
  SummaryCounts,
  SummaryCountsResponse,
} from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthResponse | null>(null);
  const [summaryCounts, setSummaryCounts] = useState<SummaryCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const healthResponse = await axios.get('/api/v1/admin/health');
        setServices(healthResponse.data);
        const dbHealthResponse = await axios.get<DatabaseHealthResponse>('api/v1/admin/health/db');
        setDbHealth(dbHealthResponse.data);
        const summaryResponse = await axios.get<SummaryCountsResponse>('api/v1/admin/summary-counts');
        setSummaryCounts(summaryResponse.data.counts);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

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
                  <Typography color="text.secondary" sx={{ flex: 1 }}>
                    Uptime: {service.uptime}
                  </Typography>
                  <Typography color="text.secondary">Memory: {service.memory}</Typography>
                  <Typography color="text.secondary">CPU: {service.cpu}</Typography>
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
    </Box>
  );
}
