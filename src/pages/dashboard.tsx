import { useEffect, useState } from 'react';

import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { ServiceStatus } from '../types/types';
import axios from 'axios';

export default function Dashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/v1/services/status');
        setServices(response.data);
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
    <Grid container spacing={3}>
      {services.map((service) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.name}>
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
                  service.status === 'running'
                    ? 'success.main'
                    : service.status === 'error'
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
  );
}
