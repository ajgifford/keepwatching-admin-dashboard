import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { DBQueryCallHistory } from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function QueryHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryName = searchParams.get('queryName');

  const [queryHistory, setQueryHistory] = useState<DBQueryCallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(100);
  const [sortBy, setSortBy] = useState<'timestamp' | 'executionTime'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!queryName) {
      navigate('/dbStats');
      return;
    }

    const fetchQueryHistory = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/services/db/query-history', {
          params: { queryName, limit },
        });
        setQueryHistory(response.data);
      } catch (error) {
        console.error('Error fetching query history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueryHistory();
  }, [queryName, limit, navigate]);

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    setLimit(event.target.value as number);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatExecutionTime = (time: number) => {
    return `${time.toFixed(2)}ms`;
  };

  const handleSort = (column: 'timestamp' | 'executionTime') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedQueryHistory = useMemo(() => {
    return [...queryHistory].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return (aValue - bValue) * modifier;
    });
  }, [queryHistory, sortBy, sortOrder]);

  const SortIcon = ({ column }: { column: 'timestamp' | 'executionTime' }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
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
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dbStats')} variant="outlined">
            Back to Query Stats
          </Button>
          <Typography component="h2" variant="h6" color="primary">
            Query Call History
          </Typography>
        </Box>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="limit-select-label">Limit</InputLabel>
          <Select labelId="limit-select-label" value={limit} onChange={handleLimitChange} label="Limit">
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={250}>250</MenuItem>
            <MenuItem value={500}>500</MenuItem>
            <MenuItem value={1000}>1000</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box mb={2}>
        <Typography variant="body1" color="text.secondary">
          Query: <strong>{queryName}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Showing {queryHistory.length} most recent calls
        </Typography>
      </Box>

      {queryHistory.length === 0 ? (
        <Typography color="text.secondary">No query history available for this query</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ cursor: 'pointer', width: '250px', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort('timestamp')}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Timestamp
                    <SortIcon column="timestamp" />
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ cursor: 'pointer', width: '250px' }}
                  onClick={() => handleSort('executionTime')}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    Execution Time
                    <SortIcon column="executionTime" />
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ width: '200px' }}>
                  Status
                </TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedQueryHistory.map((call, index) => (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: call.success ? 'inherit' : 'error.dark',
                    '&:hover': { backgroundColor: call.success ? 'action.hover' : 'error.main' },
                  }}
                >
                  <TableCell>{formatTimestamp(call.timestamp)}</TableCell>
                  <TableCell align="center">{formatExecutionTime(call.executionTime)}</TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        color: call.success ? 'success.main' : 'error.light',
                        fontWeight: 'bold',
                      }}
                    >
                      {call.success ? 'SUCCESS' : 'FAILED'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {call.error && (
                      <Typography variant="body2" color="error.light">
                        {call.error}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
