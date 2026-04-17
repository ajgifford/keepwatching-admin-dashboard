import React, { useCallback, useEffect, useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import { AdminRatingWithProfile, AdminRecommendationWithProfile, RatingContentType } from '@ajgifford/keepwatching-types';
import { ApiErrorResponse, ErrorComponent, LoadingComponent, buildTMDBImagePath, formatFullDate } from '@ajgifford/keepwatching-ui';
import { AxiosError } from 'axios';
import axiosInstance from '../app/api/axiosInstance';

type ContentTypeFilter = 'all' | RatingContentType;

function RatingsAndRecommendations() {
  const [tab, setTab] = useState(0);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [profileIdFilter, setProfileIdFilter] = useState('');

  const [ratings, setRatings] = useState<AdminRatingWithProfile[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState<ApiErrorResponse | null>(null);

  const [recommendations, setRecommendations] = useState<AdminRecommendationWithProfile[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<ApiErrorResponse | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'rating' | 'recommendation'; id: number } | null>(null);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (contentTypeFilter !== 'all') params.contentType = contentTypeFilter;
    if (accountIdFilter.trim()) params.accountId = accountIdFilter.trim();
    if (profileIdFilter.trim()) params.profileId = profileIdFilter.trim();
    return params;
  }, [contentTypeFilter, accountIdFilter, profileIdFilter]);

  const loadRatings = useCallback(async () => {
    setRatingsLoading(true);
    setRatingsError(null);
    try {
      const response = await axiosInstance.get('/api/v1/ratings', { params: buildParams() });
      setRatings(response.data.results);
    } catch (error) {
      if (error instanceof AxiosError) {
        setRatingsError(error.response?.data || { message: error.message });
      } else {
        setRatingsError({ message: 'Failed to load ratings' });
      }
    } finally {
      setRatingsLoading(false);
    }
  }, [buildParams]);

  const loadRecommendations = useCallback(async () => {
    setRecsLoading(true);
    setRecsError(null);
    try {
      const response = await axiosInstance.get('/api/v1/recommendations', { params: buildParams() });
      setRecommendations(response.data.results);
    } catch (error) {
      if (error instanceof AxiosError) {
        setRecsError(error.response?.data || { message: error.message });
      } else {
        setRecsError({ message: 'Failed to load recommendations' });
      }
    } finally {
      setRecsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    if (tab === 0) {
      loadRatings();
    } else {
      loadRecommendations();
    }
  }, [tab, loadRatings, loadRecommendations]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    try {
      if (deleteDialog.type === 'rating') {
        await axiosInstance.delete(`/api/v1/ratings/${deleteDialog.id}`);
        setRatings((prev) => prev.filter((r) => r.id !== deleteDialog.id));
      } else {
        await axiosInstance.delete(`/api/v1/recommendations/${deleteDialog.id}`);
        setRecommendations((prev) => prev.filter((r) => r.id !== deleteDialog.id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteDialog(null);
    }
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return '—';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filters = (
    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
      <ToggleButtonGroup
        size="small"
        value={contentTypeFilter}
        exclusive
        onChange={(_, val) => val && setContentTypeFilter(val)}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="show">Shows</ToggleButton>
        <ToggleButton value="movie">Movies</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        size="small"
        label="Account ID"
        value={accountIdFilter}
        onChange={(e) => setAccountIdFilter(e.target.value)}
        sx={{ width: 140 }}
      />
      <TextField
        size="small"
        label="Profile ID"
        value={profileIdFilter}
        onChange={(e) => setProfileIdFilter(e.target.value)}
        sx={{ width: 140 }}
      />
      <Button variant="outlined" size="small" onClick={tab === 0 ? loadRatings : loadRecommendations}>
        Apply
      </Button>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Ratings &amp; Recommendations
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Ratings" />
        <Tab label="Recommendations" />
      </Tabs>

      {filters}

      {tab === 0 && (
        <>
          {ratingsLoading && <LoadingComponent message="Loading ratings..." />}
          {ratingsError && <ErrorComponent error={ratingsError} homeRoute="/" homeButtonLabel="Dashboard" />}
          {!ratingsLoading && !ratingsError && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Content Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Profile</TableCell>
                    <TableCell>Account ID</TableCell>
                    <TableCell>Stars</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ratings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No ratings found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ratings.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.contentTitle}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.contentType} />
                        </TableCell>
                        <TableCell>{r.profileName}</TableCell>
                        <TableCell>{r.accountId}</TableCell>
                        <TableCell>{renderStars(r.rating)}</TableCell>
                        <TableCell>
                          <Tooltip title={r.note} placement="top" arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.note}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{formatFullDate(r.updatedAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, type: 'rating', id: r.id })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {recsLoading && <LoadingComponent message="Loading recommendations..." />}
          {recsError && <ErrorComponent error={recsError} homeRoute="/" homeButtonLabel="Dashboard" />}
          {!recsLoading && !recsError && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Poster</TableCell>
                    <TableCell>Content Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Profile</TableCell>
                    <TableCell>Account ID</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Rec Count</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recommendations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No recommendations found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recommendations.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Box
                            component="img"
                            src={buildTMDBImagePath(r.posterImage, 'w92')}
                            alt={r.contentTitle}
                            sx={{ width: 46, height: 69, borderRadius: 0.5, objectFit: 'cover' }}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = 'https://placehold.co/46x69/gray/white?text=?';
                            }}
                          />
                        </TableCell>
                        <TableCell>{r.contentTitle}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.contentType} />
                        </TableCell>
                        <TableCell>{r.profileName}</TableCell>
                        <TableCell>{r.accountId}</TableCell>
                        <TableCell>
                          <Tooltip title={r.message ?? ''} placement="top" arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 180,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.message ?? '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{renderStars(r.rating)}</TableCell>
                        <TableCell>{r.recommendationCount}</TableCell>
                        <TableCell>{formatFullDate(r.createdAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, type: 'recommendation', id: r.id })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Dialog open={!!deleteDialog?.open} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteDialog?.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RatingsAndRecommendations;
