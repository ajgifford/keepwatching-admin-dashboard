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

import { MonthlyPerformanceSummary } from '@ajgifford/keepwatching-types';
import axios from 'axios';

export default function MonthlyPerformance() {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<MonthlyPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  useEffect(() => {
    const fetchMonthlyPerformance = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/admin/health/db/monthly-performance');
        setPerformanceData(response.data);
      } catch (error) {
        console.error('Error fetching monthly performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyPerformance();
  }, []);

  const handleYearChange = (event: SelectChangeEvent<number | 'all'>) => {
    setSelectedYear(event.target.value as number | 'all');
  };

  const handleMonthChange = (event: SelectChangeEvent<number | 'all'>) => {
    setSelectedMonth(event.target.value as number | 'all');
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[month - 1];
  };

  // Get unique years and months from the data
  const availableYears = Array.from(new Set(performanceData.map((d) => d.year))).sort((a, b) => b - a);
  const availableMonths = Array.from(new Set(performanceData.map((d) => d.month))).sort((a, b) => a - b);

  // Filter data based on selections
  const filteredData = performanceData.filter((item) => {
    const yearMatch = selectedYear === 'all' || item.year === selectedYear;
    const monthMatch = selectedMonth === 'all' || item.month === selectedMonth;
    return yearMatch && monthMatch;
  });

  // Group by year/month for summary statistics
  const groupedData = filteredData.reduce(
    (acc, item) => {
      const key = `${item.year}-${item.month}`;
      if (!acc[key]) {
        acc[key] = {
          year: item.year,
          month: item.month,
          totalQueries: 0,
          totalExecutions: 0,
          avgDuration: 0,
          maxDuration: 0,
        };
      }
      acc[key].totalQueries += 1;
      acc[key].totalExecutions += item.totalExecutions;
      acc[key].avgDuration += item.avgDurationInMillis * item.totalExecutions;
      acc[key].maxDuration = Math.max(acc[key].maxDuration, item.maxDurationInMillis);
      return acc;
    },
    {} as Record<
      string,
      {
        year: number;
        month: number;
        totalQueries: number;
        totalExecutions: number;
        avgDuration: number;
        maxDuration: number;
      }
    >,
  );

  // Calculate weighted average
  Object.values(groupedData).forEach((group) => {
    group.avgDuration = group.totalExecutions > 0 ? group.avgDuration / group.totalExecutions : 0;
  });

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
            Monthly Performance Summary
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select labelId="year-select-label" value={selectedYear} onChange={handleYearChange} label="Year">
              <MenuItem value="all">All Years</MenuItem>
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="month-select-label">Month</InputLabel>
            <Select labelId="month-select-label" value={selectedMonth} onChange={handleMonthChange} label="Month">
              <MenuItem value="all">All Months</MenuItem>
              {availableMonths.map((month) => (
                <MenuItem key={month} value={month}>
                  {getMonthName(month)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredData.length} query performance records
        </Typography>
      </Box>

      {/* Summary Statistics by Month */}
      {Object.keys(groupedData).length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" color="primary" gutterBottom>
            Monthly Summary
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="center">Total Queries</TableCell>
                  <TableCell align="center">Total Executions</TableCell>
                  <TableCell align="center">Avg Duration (ms)</TableCell>
                  <TableCell align="center">Max Duration (ms)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedData)
                  .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
                  .map(([key, data]) => (
                    <TableRow key={key}>
                      <TableCell>
                        {getMonthName(data.month)} {data.year}
                      </TableCell>
                      <TableCell align="center">{data.totalQueries.toLocaleString()}</TableCell>
                      <TableCell align="center">{data.totalExecutions.toLocaleString()}</TableCell>
                      <TableCell align="center">{data.avgDuration.toFixed(2)}</TableCell>
                      <TableCell align="center">{data.maxDuration.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Detailed Query Performance */}
      <Typography variant="h6" color="primary" gutterBottom>
        Query Performance Details
      </Typography>
      {filteredData.length === 0 ? (
        <Typography color="text.secondary">No performance data available</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Query Template</TableCell>
                <TableCell align="center">Executions</TableCell>
                <TableCell align="center">Avg (ms)</TableCell>
                <TableCell align="center">Min (ms)</TableCell>
                <TableCell align="center">Max (ms)</TableCell>
                <TableCell align="center">P50 (ms)</TableCell>
                <TableCell align="center">P95 (ms)</TableCell>
                <TableCell align="center">P99 (ms)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .sort((a, b) => {
                  if (b.year !== a.year) return b.year - a.year;
                  if (b.month !== a.month) return b.month - a.month;
                  return b.avgDurationInMillis - a.avgDurationInMillis;
                })
                .map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      {getMonthName(item.month)} {item.year}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" noWrap title={item.queryTemplate}>
                        {item.queryTemplate}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.totalExecutions.toLocaleString()}</TableCell>
                    <TableCell align="center">{item.avgDurationInMillis}</TableCell>
                    <TableCell align="center">{item.minDurationInMillis}</TableCell>
                    <TableCell align="center">{item.maxDurationInMillis}</TableCell>
                    <TableCell align="center">{item.p50DurationInMillis || '--'}</TableCell>
                    <TableCell align="center">{item.p95DurationInMillis || '--'}</TableCell>
                    <TableCell align="center">{item.p99DurationInMillis || '--'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
