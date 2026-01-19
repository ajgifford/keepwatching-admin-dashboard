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
import { AdminShow } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface ShowFilters {
  types: string[];
  statuses: string[];
  networks: string[];
  streamingServices: string[];
}

interface ApiResponse {
  message: string;
  pagination: PaginationInfo;
  filters: ShowFilters;
  results: AdminShow[];
}

export default function Shows() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shows, setShows] = useState<AdminShow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // API uses 1-based indexing
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [updatingShow, setUpdatingShow] = useState<boolean>(false);
  const [updatingAll, setUpdatingAll] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [availableFilters, setAvailableFilters] = useState<ShowFilters | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [networkFilter, setNetworkFilter] = useState<string>('');
  const [streamingServiceFilter, setStreamingServiceFilter] = useState<string>('');
  const rowsPerPage = 50;

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    const networkParam = searchParams.get('network');
    const streamingServiceParam = searchParams.get('streamingService');

    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setPage(pageNumber);
      }
    }

    if (typeParam) setTypeFilter(typeParam);
    if (statusParam) setStatusFilter(statusParam);
    if (networkParam) setNetworkFilter(networkParam);
    if (streamingServiceParam) setStreamingServiceFilter(streamingServiceParam);

    if (typeParam || statusParam || networkParam || streamingServiceParam) {
      setShowFilters(true);
    }
  }, []);

  useEffect(() => {
    fetchShows();
  }, [page, typeFilter, statusFilter, networkFilter, streamingServiceFilter]);

  const fetchShows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', rowsPerPage.toString());
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (networkFilter) params.set('network', networkFilter);
      if (streamingServiceFilter) params.set('streamingService', streamingServiceFilter);

      const response = await axios.get<ApiResponse>(`/api/v1/shows?${params.toString()}`);
      setShows(response.data.results);
      setPagination(response.data.pagination);
      setAvailableFilters(response.data.filters);
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (show: AdminShow) => {
    if (updatingShow) return; // Prevent clicks during update

    if (selected && selected.id === show.id && selected.tmdbId === show.tmdbId) {
      setSelected(null);
    } else {
      setSelected({
        id: show.id,
        tmdbId: show.tmdbId,
      });
    }
  };

  const isSelected = (show: AdminShow) => {
    return selected !== null && selected.id === show.id && selected.tmdbId === show.tmdbId;
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    if (updatingShow) return; // Prevent page changes during update
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
      case 'type':
        setTypeFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'network':
        setNetworkFilter(value);
        break;
      case 'streamingService':
        setStreamingServiceFilter(value);
        break;
    }
  };

  const handleClearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setNetworkFilter('');
    setStreamingServiceFilter('');
    setPage(1);
    updateSearchParams({
      type: null,
      status: null,
      network: null,
      streamingService: null,
      page: '1',
    });
  };

  const hasActiveFilters = typeFilter || statusFilter || networkFilter || streamingServiceFilter;

  const handleCheckForUpdates = async () => {
    if (selected === null) {
      setUpdateMessage('Please select a show');
      setShowMessage(true);
      return;
    }

    setUpdatingShow(true);
    try {
      await axios.post('/api/v1/shows/update', {
        showId: selected.id,
        tmdbId: selected.tmdbId,
      });

      await fetchShows();

      const updatedShow = shows.find((show) => show.id === selected.id);
      if (updatedShow) {
        setSelected({
          id: updatedShow.id,
          tmdbId: updatedShow.tmdbId,
        });
      }

      setUpdateMessage('Successfully checked for updates for the selected show');
      setShowMessage(true);
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateMessage('Error checking for updates. Please try again.');
      setShowMessage(true);
    } finally {
      setUpdatingShow(false);
    }
  };

  const handleCheckAllForUpdates = async () => {
    setUpdatingAll(true);
    try {
      await axios.post('/api/v1/shows/updateAll');
      setUpdateMessage('Successfully started the show update process');
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
          Shows
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1">Showing {pagination?.totalCount} shows</Typography>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters{' '}
              {hasActiveFilters &&
                `(${[typeFilter, statusFilter, networkFilter, streamingServiceFilter].filter(Boolean).length})`}
            </Button>
            {hasActiveFilters && (
              <Button variant="text" size="small" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckForUpdates}
              disabled={selected === null || updatingShow || updatingAll}
              startIcon={updatingShow ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {updatingShow ? 'Updating...' : 'Update Show'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckAllForUpdates}
              disabled={updatingShow || updatingAll}
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
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {(availableFilters?.types ?? []).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {(availableFilters?.statuses ?? []).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Network</InputLabel>
                <Select
                  value={networkFilter}
                  label="Network"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('network', e.target.value)}
                >
                  <MenuItem value="">All Networks</MenuItem>
                  {(availableFilters?.networks ?? []).map((network) => (
                    <MenuItem key={network} value={network}>
                      {network}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Streaming Service</InputLabel>
                <Select
                  value={streamingServiceFilter}
                  label="Streaming Service"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('streamingService', e.target.value)}
                >
                  <MenuItem value="">All Services</MenuItem>
                  {(availableFilters?.streamingServices ?? []).map((service) => (
                    <MenuItem key={service} value={service}>
                      {service}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Collapse>

        <Paper sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading || updatingShow ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  opacity: updatingShow ? 0.6 : 1,
                  pointerEvents: updatingShow ? 'none' : 'auto',
                  flex: 1,
                  overflow: 'auto',
                }}
              >
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Seasons</TableCell>
                      <TableCell align="center">Episodes</TableCell>
                      <TableCell>Genres</TableCell>
                      <TableCell>Network</TableCell>
                      <TableCell>Streaming On</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shows.map((show) => {
                      const isItemSelected = isSelected(show);
                      return (
                        <TableRow
                          hover
                          onClick={() => handleClick(show)}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={show.id}
                          selected={isItemSelected}
                          sx={{
                            cursor: updatingShow ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isItemSelected} disabled={updatingShow} />
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {show.title}
                          </TableCell>
                          <TableCell>{show.type}</TableCell>
                          <TableCell>{show.status}</TableCell>
                          <TableCell align="center">{show.seasonCount}</TableCell>
                          <TableCell align="center">{show.episodeCount}</TableCell>
                          <TableCell>{show.genres}</TableCell>
                          <TableCell>{show.network}</TableCell>
                          <TableCell>{show.streamingServices}</TableCell>
                          <TableCell>{new Date(show.lastUpdated).toLocaleString()}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              component={Link}
                              to={`/shows/${show.id}?${searchParams.toString()}`}
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
                  disabled={updatingShow || updatingAll}
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
