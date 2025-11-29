import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

import PerformanceTrendChart from '../components/performanceTrendChart';
import { DailySummary } from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function PerformanceTrends() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryHash = searchParams.get('queryHash');
  const queryName = searchParams.get('queryName');

  const [trends, setTrends] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (!queryHash) {
      navigate('/dbHealth');
      return;
    }

    if (!startDate || !endDate) return;

    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/admin/health/db/performance-trends', {
          params: {
            queryHash,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        });
        setTrends(response.data);
      } catch (error) {
        console.error('Error fetching performance trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [queryHash, startDate, endDate, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outlined">
            Back
          </Button>
          <Typography component="h2" variant="h6" color="primary">
            Performance Trends
          </Typography>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          slotProps={{ textField: { size: 'small' } }}
        />
      </Box>

      <Box mb={2}>
        <Typography variant="body1" color="text.secondary">
          Query: <strong>{queryName || queryHash}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Showing trends from {startDate?.toLocaleDateString()} to {endDate?.toLocaleDateString()}
        </Typography>
      </Box>

      {trends.length === 0 ? (
        <Typography color="text.secondary">No performance data available for the selected date range</Typography>
      ) : (
        <PerformanceTrendChart data={trends} queryName={queryName || queryHash || 'Unknown Query'} />
      )}
    </Box>
  );
}
