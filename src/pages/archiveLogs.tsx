import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

import { ArchiveLogEntry } from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function ArchiveLogs() {
  const navigate = useNavigate();
  const [archiveLogs, setArchiveLogs] = useState<ArchiveLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    const fetchArchiveLogs = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/admin/health/db/archive-logs', {
          params: { limit },
        });
        setArchiveLogs(response.data);
      } catch (error) {
        console.error('Error fetching archive logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArchiveLogs();
  }, [limit]);

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    setLimit(event.target.value as number);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success.main';
      case 'failed':
        return 'error.main';
      case 'started':
        return 'warning.main';
      default:
        return 'text.primary';
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dbHealth')} variant="outlined">
            Back to DB Health
          </Button>
          <Typography component="h2" variant="h6" color="primary">
            Archive Execution Logs
          </Typography>
        </Box>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="limit-select-label">Limit</InputLabel>
          <Select labelId="limit-select-label" value={limit} onChange={handleLimitChange} label="Limit">
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {archiveLogs.length} most recent archive execution logs
        </Typography>
      </Box>

      {archiveLogs.length === 0 ? (
        <Typography color="text.secondary">No archive logs available</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '200px' }}>Archive Date</TableCell>
                <TableCell sx={{ width: '200px' }}>Started At</TableCell>
                <TableCell sx={{ width: '200px' }}>Completed At</TableCell>
                <TableCell align="center" sx={{ width: '150px' }}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ width: '150px' }}>
                  Metrics Archived
                </TableCell>
                <TableCell align="center" sx={{ width: '150px' }}>
                  Queries Processed
                </TableCell>
                <TableCell>Error Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archiveLogs.map((log) => (
                <TableRow
                  key={log.id}
                  sx={{
                    backgroundColor: log.status === 'failed' ? 'error.dark' : 'inherit',
                    '&:hover': { backgroundColor: log.status === 'failed' ? 'error.main' : 'action.hover' },
                  }}
                >
                  <TableCell>{formatDate(log.archiveDate)}</TableCell>
                  <TableCell>{formatDate(log.startedAt)}</TableCell>
                  <TableCell>{log.completedAt ? formatDate(log.completedAt) : '--'}</TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        color: getStatusColor(log.status),
                        fontWeight: 'bold',
                      }}
                    >
                      {log.status.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{log.metricsArchived.toLocaleString()}</TableCell>
                  <TableCell align="center">{log.queriesProcessed.toLocaleString()}</TableCell>
                  <TableCell>
                    {log.errorMessage && (
                      <Typography variant="body2" color="error.light">
                        {log.errorMessage}
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
