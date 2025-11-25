import { useEffect, useState, useRef, useMemo } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ClearIcon from '@mui/icons-material/Clear';

import {
  AppLogEntryViewer,
  ErrorLogEntryViewer,
  GenericLogEntryViewer,
  NginxLogEntryViewer,
} from '../components/logEntryViewer';
import { AppLogEntry, ErrorLogEntry, LogEntry, LogFilter, NginxLogEntry } from '@ajgifford/keepwatching-types';
import axios from 'axios';
import { useLogStream } from '../hooks/useLogStream';

type LogMode = 'historical' | 'streaming';

export default function Logs() {
  const [mode, setMode] = useState<LogMode>('streaming');
  const [historicalLogs, setHistoricalLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<LogFilter>({
    service: '',
    level: '',
    startDate: null,
    endDate: null,
    searchTerm: '',
  });

  // SSE log streaming
  const {
    logs: streamedLogs,
    isConnected,
    error: streamError,
    clearLogs,
    pauseStream,
    resumeStream,
    isPaused,
  } = useLogStream('/api/v1/logs/stream');

  // Fetch historical logs
  const fetchHistoricalLogs = async () => {
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

      setHistoricalLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch historical logs. Please try again.');
    }
  };

  // Fetch historical logs when in historical mode or filters change
  useEffect(() => {
    if (mode === 'historical') {
      fetchHistoricalLogs();
    }
  }, [filters, mode]);

  // Handle stream errors
  useEffect(() => {
    if (streamError) {
      setError(streamError.message);
    }
  }, [streamError]);

  // Get the appropriate log source based on mode
  const logs = mode === 'streaming' ? streamedLogs : historicalLogs;

  // Apply client-side filters to logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Service filter
      if (filters.service && filters.service !== 'all' && log.service !== filters.service) {
        return false;
      }

      // Level filter
      if (filters.level && filters.level !== 'all' && log.level !== filters.level) {
        return false;
      }

      // Search filter
      if (filters.searchTerm && !log.message.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Date range filters (for streaming mode, apply client-side)
      if (mode === 'streaming') {
        const logDate = new Date(log.timestamp);

        if (filters.startDate && logDate < new Date(filters.startDate)) {
          return false;
        }

        if (filters.endDate && logDate > new Date(filters.endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filters, mode]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && mode === 'streaming') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll, mode]);

  const handleFilterChange = (field: keyof LogFilter, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: LogMode | null) => {
    if (newMode !== null) {
      setMode(newMode);
      setPage(0);
    }
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

  function isAppLogEntry(entry: LogEntry): entry is AppLogEntry {
    return (entry as AppLogEntry).logId !== undefined;
  }

  function isNginxLogEntry(entry: LogEntry): entry is NginxLogEntry {
    return (entry as NginxLogEntry).remoteAddr !== undefined;
  }

  function isErrorLogEntry(entry: LogEntry): entry is ErrorLogEntry {
    return (entry as ErrorLogEntry).stack !== undefined;
  }

  function renderLogDetails(entry: LogEntry) {
    if (isAppLogEntry(entry)) {
      return <AppLogEntryViewer entry={entry} />;
    } else if (isNginxLogEntry(entry)) {
      return <NginxLogEntryViewer entry={entry} />;
    } else if (isErrorLogEntry(entry)) {
      return <ErrorLogEntryViewer entry={entry} />;
    } else {
      return <GenericLogEntryViewer content={JSON.stringify(entry, null, 2)} />;
    }
  }

  return (
    <Box>
      {/* Mode Toggle and Connection Status */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small" color="primary">
            <ToggleButton value="streaming">Live Streaming</ToggleButton>
            <ToggleButton value="historical">Historical</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'streaming' && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                onClick={isPaused ? resumeStream : pauseStream}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={clearLogs}>
                Clear
              </Button>
              <Typography variant="caption" color="text.secondary">
                {filteredLogs.length} logs
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Log Filters</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setFilters({
                service: '',
                level: '',
                startDate: null,
                endDate: null,
                searchTerm: '',
              });
              setPage(0);
            }}
          >
            Clear All Filters
          </Button>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Service</InputLabel>
              <Select
                value={filters.service}
                label="Service"
                onChange={(e) => handleFilterChange('service', e.target.value)}
              >
                <MenuItem value="all">All Services</MenuItem>
                <MenuItem value="nginx">Nginx</MenuItem>
                <MenuItem value="App">App</MenuItem>
                <MenuItem value="Console">Console</MenuItem>
                <MenuItem value="Console-Error">Console Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DateTimePicker
              label="Start Date"
              value={filters.startDate ? new Date(filters.startDate) : null}
              onChange={(date) => handleFilterChange('startDate', date)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DateTimePicker
              label="End Date"
              value={filters.endDate ? new Date(filters.endDate) : null}
              onChange={(date) => handleFilterChange('endDate', date)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search in log messages..."
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 400px)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log, index) => (
              <TableRow key={`${log.timestamp}-${index}`} hover>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={log.service} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.level}
                    size="small"
                    color={getLevelColor(log.level) as 'default' | 'error' | 'warning' | 'info'}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: '800px' }}>
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
                <TableCell sx={{ maxWidth: '800px' }}>{renderLogDetails(log)}</TableCell>
              </TableRow>
            ))}
            {mode === 'streaming' && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div ref={logsEndRef} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={filteredLogs.length}
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
