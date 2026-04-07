import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
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
import { AdminEpisode, AdminShow } from '@ajgifford/keepwatching-types';
import { ApiErrorResponse, ErrorComponent, LoadingComponent, formatFullDate } from '@ajgifford/keepwatching-ui';
import axios, { AxiosError } from 'axios';

interface DuplicateGroup {
  seasonId: number;
  seasonNumber: number;
  episodeNumber: number;
  episodes: AdminEpisode[];
}

interface DuplicateSeason {
  seasonNumber: number;
  groups: DuplicateGroup[];
}

function groupDuplicates(episodes: AdminEpisode[]): DuplicateSeason[] {
  const bySeasonAndEpisode: Record<string, DuplicateGroup> = {};

  for (const episode of episodes) {
    const key = `${episode.seasonId}-${episode.episodeNumber}`;
    if (!bySeasonAndEpisode[key]) {
      bySeasonAndEpisode[key] = {
        seasonId: episode.seasonId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        episodes: [],
      };
    }
    bySeasonAndEpisode[key].episodes.push(episode);
  }

  const bySeason: Record<number, DuplicateSeason> = {};
  for (const group of Object.values(bySeasonAndEpisode)) {
    if (!bySeason[group.seasonNumber]) {
      bySeason[group.seasonNumber] = { seasonNumber: group.seasonNumber, groups: [] };
    }
    bySeason[group.seasonNumber].groups.push(group);
  }

  return Object.values(bySeason).sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export default function DuplicateEpisodes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const page = searchParams.get('page');

  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<ApiErrorResponse | null>(null);
  const [show, setShow] = useState<AdminShow | null>(null);
  const [duplicateSeasons, setDuplicateSeasons] = useState<DuplicateSeason[]>([]);
  const [expandedSeason, setExpandedSeason] = useState<number | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminEpisode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadShow = useCallback(async () => {
    const response = await axios.get(`/api/v1/shows/${id}/details`);
    setShow(response.data.results);
  }, [id]);

  const loadDuplicates = useCallback(async () => {
    const response = await axios.get(`/api/v1/shows/${id}/duplicateEpisodes`);
    const episodes: AdminEpisode[] = response.data.results;
    setDuplicateSeasons(groupDuplicates(episodes));
  }, [id]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingError(null);
      await Promise.all([loadShow(), loadDuplicates()]);
    } catch (error) {
      if (error instanceof AxiosError) {
        setLoadingError(error.response?.data || { message: error.message });
      } else {
        setLoadingError({ message: 'An unknown error occurred' });
      }
    } finally {
      setLoading(false);
    }
  }, [loadShow, loadDuplicates]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/v1/shows/${id}/episodes/${deleteTarget.id}`);
      setSnackbar({ open: true, message: `Episode "${deleteTarget.title}" deleted successfully`, severity: 'success' });
      setDeleteTarget(null);
      await loadDuplicates();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Delete failed';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const from = searchParams.get('from');
  const fromPage = searchParams.get('fromPage');
  const accountId = searchParams.get('accountId');

  const handleBack = () => {
    if (from === 'summary') {
      navigate('/shows/duplicates');
    } else if (from === 'showDetails') {
      const params = new URLSearchParams();
      if (fromPage) params.set('from', fromPage);
      if (accountId) params.set('accountId', accountId);
      if (page) params.set('page', page);
      const query = params.toString();
      navigate(`/shows/${id}${query ? `?${query}` : ''}`);
    } else if (page) {
      navigate(`/shows?page=${page}`);
    } else {
      navigate('/shows');
    }
  };

  if (!id) {
    return (
      <Box m={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Show ID is missing
        </Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Shows
        </Button>
      </Box>
    );
  }

  if (loading) {
    return <LoadingComponent message="Checking for duplicate episodes..." />;
  }

  if (loadingError) {
    return <ErrorComponent error={loadingError} homeRoute="/" homeButtonLabel="Dashboard" />;
  }

  const totalDuplicateGroups = duplicateSeasons.reduce((sum, s) => sum + s.groups.length, 0);
  const totalDuplicateEpisodes = duplicateSeasons.reduce(
    (sum, s) => sum + s.groups.reduce((gs, g) => gs + g.episodes.length, 0),
    0,
  );

  return (
    <ErrorBoundary>
      <Box>
        <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <IconButton onClick={handleBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5">Duplicate Episode Checker</Typography>
              {show && (
                <Typography variant="body2" color="text.secondary">
                  {show.title}
                </Typography>
              )}
            </Box>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAll} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {totalDuplicateGroups === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ContentCopyIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No duplicate episodes found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All episodes in this show have unique episode numbers within their seasons.
            </Typography>
          </Paper>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Found <strong>{totalDuplicateGroups}</strong> duplicate group
              {totalDuplicateGroups !== 1 ? 's' : ''} across{' '}
              <strong>{totalDuplicateEpisodes}</strong> episodes. Review each group and delete the
              incorrect entry.
            </Alert>

            {duplicateSeasons.map((season) => (
              <Accordion
                key={season.seasonNumber}
                expanded={expandedSeason === season.seasonNumber}
                onChange={(_, isExpanded) => setExpandedSeason(isExpanded ? season.seasonNumber : false)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6">Season {season.seasonNumber}</Typography>
                    <Chip
                      label={`${season.groups.length} duplicate group${season.groups.length !== 1 ? 's' : ''}`}
                      color="warning"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {season.groups.map((group) => (
                    <Box key={`${group.seasonId}-${group.episodeNumber}`} mb={3}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Episode {group.episodeNumber} — {group.episodes.length} duplicates
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={50}>ID</TableCell>
                              <TableCell width={140}>Still</TableCell>
                              <TableCell>Title</TableCell>
                              <TableCell>Air Date</TableCell>
                              <TableCell>Runtime</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>TMDB ID</TableCell>
                              <TableCell>Created</TableCell>
                              <TableCell align="center">Delete</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.episodes.map((episode) => (
                              <TableRow key={episode.id} hover>
                                <TableCell>{episode.id}</TableCell>
                                <TableCell>
                                  <Avatar
                                    variant="rounded"
                                    src={`https://image.tmdb.org/t/p/w200${episode.stillImage}`}
                                    sx={{ width: 120, height: 68 }}
                                    alt={episode.title}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Tooltip title={episode.overview} placement="top" arrow>
                                    <Typography variant="body2">{episode.title}</Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>{formatFullDate(episode.airDate)}</TableCell>
                                <TableCell>{episode.runtime || 'N/A'} min</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={
                                      episode.episodeType.charAt(0).toUpperCase() + episode.episodeType.slice(1)
                                    }
                                    color={episode.episodeType === 'finale' ? 'primary' : 'default'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>{episode.tmdbId}</TableCell>
                                <TableCell>{formatFullDate(episode.createdAt)}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setDeleteTarget(episode)}
                                    title="Delete episode"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)}>
          <DialogTitle>Delete Episode</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.title}&quot;</strong> (ID:{' '}
              {deleteTarget?.id}, TMDB: {deleteTarget?.tmdbId})?
              <br />
              <br />
              This will permanently remove the episode and all associated watch history for all
              profiles. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
