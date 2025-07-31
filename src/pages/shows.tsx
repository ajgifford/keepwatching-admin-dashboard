import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Info as InfoIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { PaginationInfo, SelectedContent } from '../types/contentTypes';
import { AdminShow } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface ApiResponse {
  message: string;
  pagination: PaginationInfo;
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
  const rowsPerPage = 50;

  useEffect(() => {
    const pageParam = searchParams.get('page');

    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setPage(pageNumber);
      }
    }
  }, []);

  useEffect(() => {
    fetchShows();
  }, [page]);

  const fetchShows = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/v1/shows?page=${page}&limit=${rowsPerPage}`);
      setShows(response.data.results);
      setPagination(response.data.pagination);
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

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', newPage.toString());
    setSearchParams(newSearchParams);
  };

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
    } catch (error) {
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
    <Box sx={{ width: '100%', padding: 3, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>
        Shows
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          {selected !== null ? '1 show selected' : 'No show selected'} • Showing {pagination?.totalCount} shows
        </Typography>
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

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer
          sx={{
            opacity: updatingShow ? 0.6 : 1,
            pointerEvents: updatingShow ? 'none' : 'auto',
            position: 'relative',
          }}
        >
          {loading || updatingShow ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
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
                          to={`/shows/${show.id}?page=${page}`}
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
          )}
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
  );
}
