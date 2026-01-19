import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FilterList as FilterListIcon, Info as InfoIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { PaginationInfo, SelectedContent } from '../types/contentTypes';
import { AdminMovie } from '@ajgifford/keepwatching-types';
import { formatFullDate } from '@ajgifford/keepwatching-ui';
import axios from 'axios';

interface MovieFilters {
  streamingServices: string[];
  years: string[];
}

interface ApiResponse {
  message: string;
  pagination: PaginationInfo;
  filters: MovieFilters;
  results: AdminMovie[];
}

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // API uses 1-based indexing
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [updatingMovie, setUpdatingMovie] = useState<boolean>(false);
  const [updatingAll, setUpdatingAll] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [availableFilters, setAvailableFilters] = useState<MovieFilters | null>(null);
  const [streamingServiceFilter, setStreamingServiceFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const rowsPerPage = 50;

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const streamingServiceParam = searchParams.get('streamingService');
    const yearParam = searchParams.get('year');

    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setPage(pageNumber);
      }
    }

    if (streamingServiceParam) setStreamingServiceFilter(streamingServiceParam);
    if (yearParam) setYearFilter(yearParam);

    if (streamingServiceParam || yearParam) {
      setShowFilters(true);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [page, streamingServiceFilter, yearFilter]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', rowsPerPage.toString());
      if (streamingServiceFilter) params.set('streamingService', streamingServiceFilter);
      if (yearFilter) params.set('year', yearFilter);

      const response = await axios.get<ApiResponse>(`/api/v1/movies?${params.toString()}`);
      setMovies(response.data.results);
      setPagination(response.data.pagination);
      setAvailableFilters(response.data.filters);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (movie: AdminMovie) => {
    if (updatingMovie) return; // Prevent clicks during update

    if (selected && selected.id === movie.id && selected.tmdbId === movie.tmdbId) {
      setSelected(null);
    } else {
      setSelected({
        id: movie.id,
        tmdbId: movie.tmdbId,
      });
    }
  };

  const isSelected = (movie: AdminMovie) => {
    return selected !== null && selected.id === movie.id && selected.tmdbId === movie.tmdbId;
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    if (updatingMovie) return; // Prevent page changes during update
    setPage(newPage);
    updateSearchParams({ page: newPage.toString() });
  };

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setPage(1); // Reset to first page when filter changes
    updateSearchParams({ [filterName]: value || null, page: '1' });

    switch (filterName) {
      case 'streamingService':
        setStreamingServiceFilter(value);
        break;
      case 'year':
        setYearFilter(value);
        break;
    }
  };

  const handleClearFilters = () => {
    setStreamingServiceFilter('');
    setYearFilter('');
    setPage(1);
    updateSearchParams({
      streamingService: null,
      year: null,
      page: '1',
    });
  };

  const hasActiveFilters = streamingServiceFilter || yearFilter;

  const handleCheckForUpdates = async () => {
    if (selected === null) {
      setUpdateMessage('Please select a movie');
      setShowMessage(true);
      return;
    }

    setUpdatingMovie(true);
    try {
      await axios.post('/api/v1/movies/update', {
        movieId: selected.id,
        tmdbId: selected.tmdbId,
      });

      await fetchMovies();

      const updatedMovie = movies.find((movie) => movie.id === selected.id);
      if (updatedMovie) {
        setSelected({
          id: updatedMovie.id,
          tmdbId: updatedMovie.tmdbId,
        });
      }

      setUpdateMessage('Successfully checked for updates for the selected movie');
      setShowMessage(true);
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateMessage('Error checking for updates. Please try again.');
      setShowMessage(true);
    } finally {
      setUpdatingMovie(false);
    }
  };

  const handleCheckAllForUpdates = async () => {
    setUpdatingAll(true);
    try {
      await axios.post('/api/v1/movies/updateAll');
      setUpdateMessage('Successfully started the movie update process');
      setShowMessage(true);
    } catch {
      setUpdateMessage('Error checking for updates. Please try again.');
      setShowMessage(true);
    } finally {
      setUpdatingAll(false);
    }
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  return (
    <ErrorBoundary>
    <Box sx={{ width: '100%', height: '92vh', padding: 3, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Movies
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1">Showing {pagination?.totalCount} movies</Typography>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filters {hasActiveFilters ? `(${[streamingServiceFilter, yearFilter].filter(Boolean).length})` : ''}
          </Button>
          {hasActiveFilters && (
            <Button variant="text" onClick={handleClearFilters} size="small" color="secondary">
              Clear Filters
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckForUpdates}
            disabled={selected === null || updatingMovie || updatingAll}
            startIcon={updatingMovie ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {updatingMovie ? 'Updating...' : 'Update'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckAllForUpdates}
            disabled={updatingMovie || updatingAll}
            startIcon={updatingAll ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {updatingAll ? 'Updating...' : 'Update All'}
          </Button>
        </Box>
      </Box>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Streaming Service</InputLabel>
              <Select
                value={streamingServiceFilter}
                label="Streaming Service"
                onChange={(e: SelectChangeEvent) => handleFilterChange('streamingService', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(availableFilters?.streamingServices ?? []).map((service) => (
                  <MenuItem key={service} value={service}>
                    {service}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={yearFilter}
                label="Year"
                onChange={(e: SelectChangeEvent) => handleFilterChange('year', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(availableFilters?.years ?? []).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Collapse>

      <Paper sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading || updatingMovie ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer
              sx={{
                opacity: updatingMovie ? 0.6 : 1,
                pointerEvents: updatingMovie ? 'none' : 'auto',
                flex: 1,
                overflow: 'auto',
              }}
            >
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Release Date</TableCell>
                    <TableCell>Runtime</TableCell>
                    <TableCell>Genres</TableCell>
                    <TableCell>Streaming On</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movies.map((movie) => {
                    const isItemSelected = isSelected(movie);
                    return (
                      <TableRow
                        hover
                        onClick={() => handleClick(movie)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={movie.id}
                        selected={isItemSelected}
                        sx={{
                          cursor: updatingMovie ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isItemSelected} disabled={updatingMovie} />
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {movie.title}
                        </TableCell>
                        <TableCell>{formatFullDate(movie.releaseDate)}</TableCell>
                        <TableCell>{`${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`}</TableCell>
                        <TableCell>{movie.genres}</TableCell>
                        <TableCell>{movie.streamingServices}</TableCell>
                        <TableCell>{new Date(movie.lastUpdated).toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            component={Link}
                            to={`/movies/${movie.id}?${searchParams.toString()}`}
                            onClick={(e) => e.stopPropagation()} // Prevent row selection when clicking the button
                            size="small"
                            color="primary"
                            title="View Details"
                          >
                            <InfoIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Pagination
                count={pagination?.totalPages || 0}
                page={pagination?.currentPage || 1}
                onChange={handleChangePage}
                disabled={updatingMovie || updatingAll}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        )}
      </Paper>

      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseMessage}
          severity={updateMessage?.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {updateMessage}
        </Alert>
      </Snackbar>
    </Box>
    </ErrorBoundary>
  );
}
