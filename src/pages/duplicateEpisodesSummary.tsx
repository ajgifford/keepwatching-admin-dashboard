import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import { ErrorBoundary } from '../components/ErrorBoundary';
import axios, { AxiosError } from 'axios';
import { buildTMDBImagePath } from '@ajgifford/keepwatching-ui';

interface ShowWithDuplicates {
  id: number;
  title: string;
  posterImage: string;
  duplicateGroupCount: number;
  extraEpisodeCount: number;
}

export default function DuplicateEpisodesSummary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shows, setShows] = useState<ShowWithDuplicates[]>([]);

  const loadShows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/v1/shows/duplicates');
      setShows(response.data.results);
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  const totalGroups = shows.reduce((sum, s) => sum + s.duplicateGroupCount, 0);
  const totalExtra = shows.reduce((sum, s) => sum + s.extraEpisodeCount, 0);

  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%', padding: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Duplicate Episodes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shows with episodes sharing the same episode number within a season
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadShows} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={6}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : shows.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <ContentCopyIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No duplicate episodes found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All shows in the catalog have unique episode numbers within their seasons.
            </Typography>
          </Paper>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Found <strong>{shows.length}</strong> show{shows.length !== 1 ? 's' : ''} with duplicates —{' '}
              <strong>{totalGroups}</strong> duplicate group{totalGroups !== 1 ? 's' : ''} containing{' '}
              <strong>{totalExtra}</strong> extra episode{totalExtra !== 1 ? 's' : ''} to review.
            </Alert>

            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Show</TableCell>
                      <TableCell align="center">Duplicate Groups</TableCell>
                      <TableCell align="center">Extra Episodes</TableCell>
                      <TableCell align="center">Review</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shows.map((show) => (
                      <TableRow
                        key={show.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/shows/${show.id}/duplicates?from=summary`)}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                              variant="rounded"
                              src={buildTMDBImagePath(show.posterImage, 'w92')}
                              alt={show.title}
                              sx={{ width: 36, height: 54 }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {show.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            {show.duplicateGroupCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="error.main" fontWeight="bold">
                            {show.extraEpisodeCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Review duplicates">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/shows/${show.id}/duplicates`);
                              }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>
    </ErrorBoundary>
  );
}
