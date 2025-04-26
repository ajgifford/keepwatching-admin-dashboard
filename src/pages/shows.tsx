import React, { useEffect, useState } from 'react';

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';

import axios from 'axios';

interface ShowJson {
  id: number;
  tmdbId: number;
  title: string;
  description: string;
  releaseDate: string;
  posterImage: string;
  backdropImage: string;
  network: string;
  seasonCount: number;
  episodeCount: number;
  streamingServices: string;
  genres: string;
  status: string;
  type: string;
  inProduction: boolean;
  lastAirDate: string;
  lastUpdated: string;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  message: string;
  pagination: PaginationInfo;
  results: ShowJson[];
}

interface SelectedShow {
  id: number;
  tmdbId: number;
}

function Shows() {
  const [shows, setShows] = useState<ShowJson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // API uses 1-based indexing
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selected, setSelected] = useState<SelectedShow | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const rowsPerPage = 50;

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

  const handleClick = (show: ShowJson) => {
    if (updating) return; // Prevent clicks during update
    
    if (selected && selected.id === show.id && selected.tmdbId === show.tmdbId) {
      setSelected(null);
    } else {
      setSelected({
        id: show.id,
        tmdbId: show.tmdbId,
      });
    }
  };

  const isSelected = (show: ShowJson) => {
    return selected !== null && selected.id === show.id && selected.tmdbId === show.tmdbId;
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    if (updating) return; // Prevent page changes during update
    setPage(newPage + 1);
  };

  const handleCheckForUpdates = async () => {
    if (selected === null) {
      setUpdateMessage('Please select a show');
      setShowMessage(true);
      return;
    }

    setUpdating(true);
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
      setUpdating(false);
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
        <Typography variant="subtitle1">{selected !== null ? '1 show selected' : 'No show selected'}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleCheckForUpdates} 
          disabled={selected === null || updating}
          startIcon={updating ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {updating ? 'Updating...' : 'Update'}
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer 
          sx={{ 
            opacity: updating ? 0.6 : 1,
            pointerEvents: updating ? 'none' : 'auto',
            position: 'relative'
          }}
        >
          {(loading || updating) ? (
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
                  <TableCell>Seasons</TableCell>
                  <TableCell>Episodes</TableCell>
                  <TableCell>Genres</TableCell>
                  <TableCell>Network</TableCell>
                  <TableCell>Streaming On</TableCell>
                  <TableCell>Last Updated</TableCell>
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
                        cursor: updating ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={isItemSelected} 
                          disabled={updating}
                        />
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[rowsPerPage]}
          component="div"
          count={pagination?.totalCount || 0}
          rowsPerPage={rowsPerPage}
          page={(pagination?.currentPage || 1) - 1} // Convert from 1-based to 0-based for the UI component
          onPageChange={handleChangePage}
          disabled={updating}
        />
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

export default Shows;
