import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

import { SlowestQuery } from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function SlowestQueries() {
  const navigate = useNavigate();
  const [slowestQueries, setSlowestQueries] = useState<SlowestQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [sortBy, setSortBy] = useState<'avgDurationInMillis' | 'maxDurationInMillis' | 'totalExecutions'>(
    'avgDurationInMillis',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchSlowestQueries = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/admin/health/db/slowest-queries', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 50,
          },
        });
        setSlowestQueries(response.data);
      } catch (error) {
        console.error('Error fetching slowest queries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlowestQueries();
  }, [startDate, endDate]);

  const handleSort = (column: 'avgDurationInMillis' | 'maxDurationInMillis' | 'totalExecutions') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedQueries = useMemo(() => {
    return [...slowestQueries].sort((a, b) => {
      const aValue = a[sortBy] ?? 0;
      const bValue = b[sortBy] ?? 0;
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return (aValue - bValue) * modifier;
    });
  }, [slowestQueries, sortBy, sortOrder]);

  const SortIcon = ({ column }: { column: 'avgDurationInMillis' | 'maxDurationInMillis' | 'totalExecutions' }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  const handleQueryClick = (queryHash: string, queryTemplate: string) => {
    navigate(
      `/performanceTrends?queryHash=${encodeURIComponent(queryHash)}&queryName=${encodeURIComponent(queryTemplate)}`,
    );
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dbHealth')} variant="outlined">
            Back to DB Health
          </Button>
          <Typography component="h2" variant="h6" color="primary">
            Slowest Queries
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
        <Typography variant="body2" color="text.secondary">
          Showing {slowestQueries.length} slowest queries from {startDate?.toLocaleDateString()} to{' '}
          {endDate?.toLocaleDateString()}
        </Typography>
      </Box>

      {slowestQueries.length === 0 ? (
        <Typography color="text.secondary">No slow queries found for the selected date range</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Query</TableCell>
                <TableCell
                  align="center"
                  sx={{ cursor: 'pointer', width: '200px' }}
                  onClick={() => handleSort('avgDurationInMillis')}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    Avg Duration
                    <SortIcon column="avgDurationInMillis" />
                  </Box>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ cursor: 'pointer', width: '200px' }}
                  onClick={() => handleSort('maxDurationInMillis')}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    Max Duration
                    <SortIcon column="maxDurationInMillis" />
                  </Box>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ cursor: 'pointer', width: '200px' }}
                  onClick={() => handleSort('totalExecutions')}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    Total Calls
                    <SortIcon column="totalExecutions" />
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedQueries.map((query, index) => (
                <TableRow
                  key={index}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                  onClick={() => handleQueryClick(query.queryHash, query.queryTemplate)}
                >
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {query.queryTemplate}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{Number(query.avgDurationInMillis || 0).toFixed(2)}ms</TableCell>
                  <TableCell align="center">{Number(query.maxDurationInMillis || 0).toFixed(2)}ms</TableCell>
                  <TableCell align="center">{query.totalExecutions.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
