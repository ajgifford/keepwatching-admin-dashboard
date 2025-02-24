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

function Shows() {
  const [shows, setShows] = useState<ShowJson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // API uses 1-based indexing
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
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

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = shows.map((show) => show.tmdbId);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (tmdbId: number) => {
    const selectedIndex = selected.indexOf(tmdbId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, tmdbId];
    } else {
      newSelected = selected.filter((id) => id !== tmdbId);
    }

    setSelected(newSelected);
  };

  const isSelected = (tmdbId: number) => selected.indexOf(tmdbId) !== -1;

  const handleChangePage = (event: unknown, newPage: number) => {
    // TablePagination uses 0-based indexing, but our API uses 1-based indexing
    setPage(newPage + 1);
  };

  const handleCheckForUpdates = async () => {
    if (selected.length === 0) {
      alert('Please select at least one show');
      return;
    }

    try {
      await axios.post('/api/v1/shows/checkUpdates', {
        tmdbIds: selected,
      });
      alert(`Successfully checked for updates for ${selected.length} shows`);
    } catch (error) {
      console.error('Error checking for updates:', error);
      alert('Error checking for updates. Please try again.');
    }
  };

  return (
    <Box sx={{ width: '100%', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Shows
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">{selected.length} shows selected</Typography>
        <Button variant="contained" color="primary" onClick={handleCheckForUpdates} disabled={selected.length === 0}>
          Check for Updates
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < shows.length}
                      checked={shows.length > 0 && selected.length === shows.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
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
                  const isItemSelected = isSelected(show.tmdbId);
                  return (
                    <TableRow
                      hover
                      onClick={() => handleClick(show.tmdbId)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={show.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
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
        />
      </Paper>
    </Box>
  );
}

export default Shows;
