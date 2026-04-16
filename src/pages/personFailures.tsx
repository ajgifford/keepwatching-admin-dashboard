import React, { useCallback, useEffect, useState } from 'react';

import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Movie as MovieIcon,
  OpenInNew as OpenInNewIcon,
  Tv as TvIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { FailureStatus, PersonDetails, PersonUpdateFailure } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface ApiResponse {
  message: string;
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  results: PersonUpdateFailure[];
}

type TabValue = 'pending' | 'resolved' | 'removed' | 'all';

const TAB_STATUSES: Record<TabValue, FailureStatus | undefined> = {
  pending: 'pending',
  resolved: 'resolved',
  removed: 'removed',
  all: undefined,
};

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function errorCodeColor(code: string): 'error' | 'warning' | 'default' {
  if (code === 'NOT_FOUND') return 'error';
  if (code === 'RATE_LIMIT') return 'warning';
  return 'default';
}

function ContentReferences({ details }: { details: PersonDetails }) {
  const hasShows = details.showCredits.length > 0;
  const hasMovies = details.movieCredits.length > 0;

  if (!hasShows && !hasMovies) {
    return (
      <Typography variant="body2" color="text.secondary">
        No content references found for this person.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {hasShows && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <TvIcon fontSize="small" color="action" />
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Shows ({details.showCredits.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {details.showCredits.map((credit, i) => (
              <Tooltip key={i} title={`as ${credit.character} · ${credit.episodeCount} ep${credit.episodeCount !== 1 ? 's' : ''}`}>
                <Chip label={`${credit.name} (${credit.year})`} size="small" variant="outlined" />
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}
      {hasShows && hasMovies && <Divider />}
      {hasMovies && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <MovieIcon fontSize="small" color="action" />
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Movies ({details.movieCredits.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {details.movieCredits.map((credit, i) => (
              <Tooltip key={i} title={`as ${credit.character}`}>
                <Chip label={`${credit.name} (${credit.year})`} size="small" variant="outlined" />
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function PersonFailures() {
  const [failures, setFailures] = useState<PersonUpdateFailure[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Expandable row state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [contentCache, setContentCache] = useState<Record<number, PersonDetails | null>>({});
  const [contentLoading, setContentLoading] = useState<number | null>(null);

  async function handleToggleExpand(failure: PersonUpdateFailure) {
    const isOpen = expandedId === failure.id;
    setExpandedId(isOpen ? null : failure.id);

    if (!isOpen && failure.personId !== null && !(failure.personId in contentCache)) {
      setContentLoading(failure.personId);
      try {
        const response = await axios.get<{ message: string; results: PersonDetails }>(
          `/api/v1/people/${failure.personId}`,
        );
        setContentCache((prev) => ({ ...prev, [failure.personId!]: response.data.results }));
      } catch {
        setContentCache((prev) => ({ ...prev, [failure.personId!]: null }));
      } finally {
        setContentLoading(null);
      }
    }
  }

  // Dialog state
  const [resolveTarget, setResolveTarget] = useState<PersonUpdateFailure | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PersonUpdateFailure | null>(null);
  const [tmdbTarget, setTmdbTarget] = useState<PersonUpdateFailure | null>(null);
  const [newTmdbId, setNewTmdbId] = useState('');
  const [tmdbDuplicateCheck, setTmdbDuplicateCheck] = useState<{ name: string; id: number } | null | 'loading'>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const rowsPerPage = 50;

  const fetchFailures = useCallback(async () => {
    setLoading(true);
    try {
      const status = TAB_STATUSES[activeTab];
      const params = new URLSearchParams({ page: String(page), limit: String(rowsPerPage) });
      if (status) params.set('status', status);
      const response = await axios.get<ApiResponse>(`/api/v1/people/failures?${params}`);
      setFailures(response.data.results);
      setTotalPages(response.data.pagination.totalPages);
      setTotalCount(response.data.pagination.totalCount);
    } catch {
      showSnackbar('Error loading person failures', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchFailures();
  }, [fetchFailures]);

  function showSnackbar(message: string, severity: 'success' | 'error') {
    setSnackbar({ open: true, message, severity });
  }

  function handleTabChange(_: React.SyntheticEvent, value: TabValue) {
    setActiveTab(value);
    setPage(1);
  }

  // Resolve
  async function handleResolve() {
    if (!resolveTarget) return;
    setActionLoading(true);
    try {
      await axios.put(`/api/v1/people/failures/${resolveTarget.personId}/resolve`, { notes: resolveNotes || undefined });
      showSnackbar(`Marked "${resolveTarget.personName}" as resolved`, 'success');
      setResolveTarget(null);
      setResolveNotes('');
      fetchFailures();
    } catch {
      showSnackbar('Error resolving failure', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // Delete person
  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/v1/people/${deleteTarget.personId}`);
      showSnackbar(`Person "${deleteTarget.personName}" deleted`, 'success');
      setDeleteTarget(null);
      fetchFailures();
    } catch {
      showSnackbar('Error deleting person', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  function handleNewTmdbIdChange(value: string) {
    setNewTmdbId(value);
    setTmdbDuplicateCheck(null);
  }

  async function handleNewTmdbIdBlur() {
    const parsed = Number(newTmdbId);
    if (!newTmdbId || isNaN(parsed) || parsed <= 0) return;
    setTmdbDuplicateCheck('loading');
    try {
      const res = await axios.get<{ results: { id: number; name: string } | null }>(`/api/v1/people/by-tmdb/${parsed}`);
      setTmdbDuplicateCheck(res.data.results ? { id: res.data.results.id, name: res.data.results.name } : null);
    } catch {
      setTmdbDuplicateCheck(null);
    }
  }

  function handleTmdbDialogClose() {
    if (actionLoading) return;
    setTmdbTarget(null);
    setNewTmdbId('');
    setTmdbDuplicateCheck(null);
  }

  async function handleMergeAndDelete() {
    if (!tmdbTarget || typeof tmdbDuplicateCheck !== 'object' || tmdbDuplicateCheck === null) return;
    setActionLoading(true);
    try {
      const result = await axios.post<{ results: { showsMerged: number; moviesMerged: number } }>(
        `/api/v1/people/${tmdbTarget.personId}/merge/${tmdbDuplicateCheck.id}`,
      );
      const { showsMerged, moviesMerged } = result.data.results;
      showSnackbar(
        `"${tmdbTarget.personName}" merged into "${tmdbDuplicateCheck.name}" and deleted (${showsMerged} show credit${showsMerged !== 1 ? 's' : ''}, ${moviesMerged} movie credit${moviesMerged !== 1 ? 's' : ''} reassigned)`,
        'success',
      );
      handleTmdbDialogClose();
      fetchFailures();
    } catch {
      showSnackbar('Error merging and deleting person', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // Update TMDB ID
  async function handleUpdateTmdbId() {
    if (!tmdbTarget || !newTmdbId) return;
    setActionLoading(true);
    try {
      await axios.put(`/api/v1/people/${tmdbTarget.personId}/tmdb-id`, { newTmdbId: Number(newTmdbId) });
      showSnackbar(`TMDB ID updated for "${tmdbTarget.personName}"`, 'success');
      setTmdbTarget(null);
      setNewTmdbId('');
      setTmdbDuplicateCheck(null);
      fetchFailures();
    } catch {
      showSnackbar('Error updating TMDB ID', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box sx={{ width: '100%', height: '92vh', padding: 3, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Person Update Failures
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip label={`${totalCount} shown`} size="small" variant="outlined" />
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Pending" value="pending" />
          <Tab label="Resolved" value="resolved" />
          <Tab label="Removed" value="removed" />
          <Tab label="All" value="all" />
        </Tabs>
      </Paper>

      <Paper sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table sx={{ minWidth: 800 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell>Person Name</TableCell>
                    <TableCell>TMDB ID</TableCell>
                    <TableCell>Error Code</TableCell>
                    <TableCell align="center">Failures</TableCell>
                    <TableCell>First Failure</TableCell>
                    <TableCell>Last Failure</TableCell>
                    {activeTab !== 'removed' && <TableCell>Resolution</TableCell>}
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeTab !== 'removed' ? 9 : 8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No failures found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    failures.map((failure) => (
                      <React.Fragment key={failure.id}>
                        <TableRow hover selected={expandedId === failure.id}>
                          <TableCell sx={{ py: 0.5 }}>
                            <IconButton size="small" onClick={() => handleToggleExpand(failure)}>
                              {expandedId === failure.id ? (
                                <KeyboardArrowUpIcon fontSize="small" />
                              ) : (
                                <KeyboardArrowDownIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{failure.personName}</TableCell>
                          <TableCell>{failure.tmdbId}</TableCell>
                          <TableCell>
                            <Chip
                              label={failure.errorCode}
                              size="small"
                              color={errorCodeColor(failure.errorCode)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={failure.failureCount} size="small" color={failure.failureCount >= 3 ? 'error' : 'default'} />
                          </TableCell>
                          <TableCell>{formatDate(failure.firstFailureAt)}</TableCell>
                          <TableCell>{formatDate(failure.lastFailureAt)}</TableCell>
                          {activeTab !== 'removed' && (
                            <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {failure.resolutionNotes ?? '—'}
                            </TableCell>
                          )}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="View on TMDB">
                                <IconButton
                                  size="small"
                                  color="info"
                                  href={`https://www.themoviedb.org/person/${failure.tmdbId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  component="a"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {failure.status === 'pending' && (
                                <>
                                  <Tooltip title="Update TMDB ID">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => { setTmdbTarget(failure); setNewTmdbId(''); }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Mark Resolved">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => { setResolveTarget(failure); setResolveNotes(''); }}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Person">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDeleteTarget(failure)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={activeTab !== 'removed' ? 9 : 8} sx={{ py: 0, borderBottom: expandedId === failure.id ? undefined : 'none' }}>
                            <Collapse in={expandedId === failure.id} timeout="auto" unmountOnExit>
                              <Box sx={{ px: 3, py: 2 }}>
                                {failure.personId === null ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Person record has been deleted — content references unavailable.
                                  </Typography>
                                ) : contentLoading === failure.personId ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">Loading content references…</Typography>
                                  </Box>
                                ) : contentCache[failure.personId] === null ? (
                                  <Typography variant="body2" color="error">
                                    Failed to load content references.
                                  </Typography>
                                ) : contentCache[failure.personId] ? (
                                  <ContentReferences details={contentCache[failure.personId]!} />
                                ) : null}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        )}
      </Paper>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveTarget} onClose={() => !actionLoading && setResolveTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Resolved</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Mark the failure for <strong>{resolveTarget?.personName}</strong> as resolved. Optionally add notes explaining why.
          </DialogContentText>
          <TextField
            label="Resolution notes (optional)"
            fullWidth
            multiline
            rows={2}
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveTarget(null)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleResolve} variant="contained" color="success" disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : undefined}>
            Mark Resolved
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !actionLoading && setDeleteTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Person</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently delete <strong>{deleteTarget?.personName}</strong> (TMDB ID: {deleteTarget?.tmdbId})?
            This will also remove all their cast references in shows and movies. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : undefined}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update TMDB ID Dialog */}
      <Dialog open={!!tmdbTarget} onClose={handleTmdbDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Update TMDB ID</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the correct TMDB ID for <strong>{tmdbTarget?.personName}</strong>. The person&apos;s data will be
            refreshed from TMDB immediately after the update.
          </DialogContentText>
          <TextField
            label="New TMDB ID"
            fullWidth
            type="text"
            inputMode="numeric"
            value={newTmdbId}
            onChange={(e) => handleNewTmdbIdChange(e.target.value.replace(/\D/g, ''))}
            onBlur={handleNewTmdbIdBlur}
            disabled={actionLoading}
            autoFocus
          />
          {tmdbDuplicateCheck === 'loading' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">Checking for duplicates…</Typography>
            </Box>
          )}
          {tmdbDuplicateCheck && tmdbDuplicateCheck !== 'loading' && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              TMDB ID <strong>{newTmdbId}</strong> is already used by <strong>{tmdbDuplicateCheck.name}</strong> (person
              ID {tmdbDuplicateCheck.id}). The update will be rejected — delete one of the two records first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTmdbDialogClose} disabled={actionLoading}>Cancel</Button>
          {typeof tmdbDuplicateCheck === 'object' && tmdbDuplicateCheck !== null && (
            <Button
              variant="contained"
              color="error"
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={handleMergeAndDelete}
            >
              Merge & Delete {tmdbTarget?.personName}
            </Button>
          )}
          <Button
            onClick={handleUpdateTmdbId}
            variant="contained"
            color="primary"
            disabled={actionLoading || !newTmdbId || tmdbDuplicateCheck === 'loading' || typeof tmdbDuplicateCheck === 'object' && tmdbDuplicateCheck !== null}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
