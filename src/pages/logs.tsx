import { useEffect, useState } from 'react';

import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  const [filters, setFilters] = useState<LogFilter>({
    service: 'all',
    level: 'all',
    startDate: null,
    endDate: null,
    searchTerm: '',
  });

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs', { params: filters });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Set up SSE connection for real-time logs
    const eventSource = new EventSource('/api/logs/stream');
    eventSource.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs((prevLogs) => [newLog, ...prevLogs]);
    };

    return () => {
      eventSource.close();
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
                <MenuItem value="express">Express</MenuItem>
                <MenuItem value="nginx">Nginx</MenuItem>
                <MenuItem value="pm2">PM2</MenuItem>
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
              <TableRow key={index}>
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
    </Box>
  );
}
