import { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

import { LogEntry, LogFilter } from '../types/types';
import axios from 'axios';

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [filters, setFilters] = useState<LogFilter>({
    service: '',
    level: '',
    startDate: null,
    endDate: null,
    searchTerm: '',
  });

  const fetchInitialLogs = async () => {
    try {
      const apiFilters = {
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
        service: filters.service === 'all' ? undefined : filters.service,
        level: filters.level === 'all' ? undefined : filters.level,
      };

      const response = await axios.get('/api/v1/logs', {
        params: apiFilters,
      });

      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch initial logs. Please try again.');
    }
  };

  const setupSSEConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    if (filters.service && filters.service !== 'all') params.append('service', filters.service);
    if (filters.level && filters.level !== 'all') params.append('level', filters.level);
    if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
    if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);

    const url = `/api/logs/stream?${params.toString()}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setConnectionStatus('connected');
      setError(null);
    });

    eventSource.addEventListener('log', (event) => {
      const newLog = JSON.parse(event.data);
      setLogs((prevLogs) => {
        const updatedLogs = [newLog, ...prevLogs];
        return updatedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    });

    eventSource.addEventListener('heartbeat', () => {
      console.debug('Heartbeat received');
    });

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      setError('Connection to log stream lost. Attempting to reconnect...');

      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          setupSSEConnection();
        }
      }, 5000);
    };
  };

  useEffect(() => {
    fetchInitialLogs();
    // setupSSEConnection();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [filters]);

  const handleFilterChange = (field: keyof LogFilter, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Log Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Service</InputLabel>
              <Select
                value={filters.service}
                label="Service"
                onChange={(e) => handleFilterChange('service', e.target.value)}
              >
                <MenuItem value="all">All Services</MenuItem>
                <MenuItem value="nginx">Nginx</MenuItem>
                <MenuItem value="HTTP">HTTP</MenuItem>
                <MenuItem value="Console">Console</MenuItem>
                <MenuItem value="Console-Error">Console Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select value={filters.level} label="Level" onChange={(e) => handleFilterChange('level', e.target.value)}>
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DateTimePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DateTimePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search in log messages..."
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Status:
          </Typography>
          <Chip
            label={connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            color={connectionStatus === 'connected' ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log, index) => (
              <TableRow key={`${log.timestamp}-${index}`} hover>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={log.service} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={log.level} size="small" color={getLevelColor(log.level) as any} />
                </TableCell>
                <TableCell>
                  <Typography
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                      fontFamily: 'monospace',
                    }}
                  >
                    {log.message}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
