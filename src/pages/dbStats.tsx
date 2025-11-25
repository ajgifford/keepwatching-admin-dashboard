import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress, Paper, Typography } from '@mui/material';

import { DBQueryStats } from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function DBStats() {
  const navigate = useNavigate();
  const [dbStats, setDBStats] = useState<DBQueryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/v1/services/db/query-stats');
        setDBStats(response.data);
      } catch (error) {
        console.error('Error fetching database query stats:', error);
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

  const handleQueryClick = (queryName: string) => {
    navigate(`/queryHistory?queryName=${encodeURIComponent(queryName)}`);
  };

  return (
    <Box>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        Query Statistics
      </Typography>
      {dbStats.map((stat, index) => (
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
      {dbStats.length === 0 && <Typography color="text.secondary">No query statistics available</Typography>}
    </Box>
  );
}
