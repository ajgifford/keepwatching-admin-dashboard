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

interface MovieJson {
  id: number;
  tmdbId: number;
  title: string;
  description: string;
  releaseDate: string;
  runtime: number;
  posterImage: string;
  backdropImage: string;
  streamingServices: string;
  genres: string;
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
  results: MovieJson[];
}

function Movies() {
  const [movies, setMovies] = useState<MovieJson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // API uses 1-based indexing
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const rowsPerPage = 50;

  useEffect(() => {
    fetchMovies();
  }, [page]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/v1/movies?page=${page}&limit=${rowsPerPage}`);
      setMovies(response.data.results);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = movies.map((movie) => movie.tmdbId);
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

  const handleCheckChanges = async () => {
    if (selected.length === 0) {
      alert('Please select at least one movie');
      return;
    }

    try {
      await axios.post('/api/v1/movies/checkUpdates', {
        tmdbIds: selected,
      });
      alert(`Successfully checked for updates for ${selected.length} movies`);
    } catch (error) {
      console.error('Error checking for updates:', error);
      alert('Error checking for updates. Please try again.');
    }
  };

  return (
    <Box sx={{ width: '100%', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Movies
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">{selected.length} movies selected</Typography>
        <Button variant="contained" color="primary" onClick={handleCheckChanges} disabled={selected.length === 0}>
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
                      indeterminate={selected.length > 0 && selected.length < movies.length}
                      checked={movies.length > 0 && selected.length === movies.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Release Date</TableCell>
                  <TableCell>Runtime</TableCell>
                  <TableCell>Genres</TableCell>
                  <TableCell>Streaming On</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movies.map((movie) => {
                  const isItemSelected = isSelected(movie.tmdbId);
                  return (
                    <TableRow
                      hover
                      onClick={() => handleClick(movie.tmdbId)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={movie.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {movie.title}
                      </TableCell>
                      <TableCell>{movie.releaseDate}</TableCell>
                      <TableCell>{movie.runtime}</TableCell>
                      <TableCell>{movie.genres}</TableCell>
                      <TableCell>{movie.streamingServices}</TableCell>
                      <TableCell>{new Date(movie.lastUpdated).toLocaleString()}</TableCell>
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

export default Movies;
