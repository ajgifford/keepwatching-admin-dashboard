import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarIcon from '@mui/icons-material/Star';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  AdminContentRatingSummary,
  AdminMovieDetails,
  AdminRatingWithProfile,
  ContentProfiles,
  WatchStatus,
} from '@ajgifford/keepwatching-types';
import {
  ApiErrorResponse,
  ErrorComponent,
  LoadingComponent,
  buildTMDBImagePath,
  formatFullDate,
  parseLocalDate,
} from '@ajgifford/keepwatching-ui';
import axios, { AxiosError } from 'axios';

function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<ApiErrorResponse | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [movie, setMovie] = useState<AdminMovieDetails | null>(null);
  const [profiles, setProfiles] = useState<ContentProfiles[] | null>(null);
  const [ratingSummary, setRatingSummary] = useState<AdminContentRatingSummary | null>(null);
  const [ratingsWithNotes, setRatingsWithNotes] = useState<AdminRatingWithProfile[] | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingDeleteDialog, setRatingDeleteDialog] = useState<number | null>(null);

  const loadMovieDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/movies/${id}/details`);
      setMovie(response.data.results);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }, [id]);

  const loadMovieProfiles = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/movies/${id}/profiles`);
      setProfiles(response.data.results);
    } catch (error) {
      console.error('Error fetching movie profiles:', error);
      throw error;
    }
  }, [id]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadMovieDetails(), loadMovieProfiles()]);
    } catch (error) {
      console.error('Error loading movie:', error);
      if (error instanceof AxiosError) {
        setLoadingError(error.response?.data || { message: error.message });
      } else {
        setLoadingError({ message: 'An unknown error occurred fetching a movie with its details' });
      }
    } finally {
      setLoading(false);
    }
  }, [loadMovieDetails, loadMovieProfiles]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const loadRatings = useCallback(async () => {
    if (ratingsLoading) return;
    setRatingsLoading(true);
    try {
      const [summaryRes, notesRes] = await Promise.all([
        axios.get(`/api/v1/movies/${id}/ratings`),
        axios.get('/api/v1/ratings', { params: { contentType: 'movie' } }),
      ]);
      setRatingSummary(summaryRes.data.results);
      const allNotes: AdminRatingWithProfile[] = notesRes.data.results;
      setRatingsWithNotes(allNotes.filter((r) => r.contentId === Number(id)));
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setRatingsLoading(false);
    }
  }, [id, ratingsLoading]);

  const handleRatingsAccordionChange = (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (isExpanded && ratingSummary === null) {
      loadRatings();
    }
  };

  const handleDeleteRating = async (ratingId: number) => {
    try {
      await axios.delete(`/api/v1/ratings/${ratingId}`);
      setRatingsWithNotes((prev) => prev?.filter((r) => r.id !== ratingId) ?? null);
      const summaryRes = await axios.get(`/api/v1/movies/${id}/ratings`);
      setRatingSummary(summaryRes.data.results);
    } catch (error) {
      console.error('Error deleting rating:', error);
    } finally {
      setRatingDeleteDialog(null);
    }
  };

  const getWatchStatusIcon = (status: WatchStatus) => {
    switch (status) {
      case WatchStatus.WATCHED:
        return <WatchLaterIcon color="success" />;
      case WatchStatus.UNAIRED:
        return <PendingOutlinedIcon color="info" />;
      case WatchStatus.NOT_WATCHED:
        return <WatchLaterOutlinedIcon color="error" />;
      default:
        return null;
    }
  };

  const handleUpdateMovie = async (movie: AdminMovieDetails | null) => {
    if (movie) {
      setUpdating(true);
      try {
        await axios.post('/api/v1/movies/update', {
          movieId: movie.id,
          tmdbId: movie.tmdbId,
        });
        await loadAllData();
      } catch (error) {
        console.error('Error updating movie:', error);
      } finally {
        setUpdating(false);
      }
    }
  };

  const formatRuntime = (minutes: number | undefined) => {
    if (minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return '';
  };

  const formatUserRating = (rating: number | undefined) => {
    if (rating) {
      return `${rating.toFixed(2)} / 10`;
    }
    return 'Unknown';
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount) {
      return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
    }
    return 'Unknown';
  };

  if (!id) {
    return (
      <Box m={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Movie ID is missing
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            const page = searchParams.get('page');
            if (page) {
              navigate(`/movies?page=${page}`);
            } else {
              navigate(`/movies`);
            }
          }}
        >
          Back to Movies
        </Button>
      </Box>
    );
  }

  if (loading) {
    return <LoadingComponent message="Loading Movie Details..." />;
  }
  if (loadingError) {
    return <ErrorComponent error={loadingError} homeRoute="/" homeButtonLabel="Dashboard" />;
  }

  return (
    <Box>
      <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => {
              const page = searchParams.get('page');
              if (page) {
                navigate(`/movies?page=${page}`);
              } else {
                navigate(`/movies`);
              }
            }}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Button
          variant="outlined"
          startIcon={updating ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={() => handleUpdateMovie(movie)}
          disabled={updating || loading}
        >
          {updating ? 'Updating...' : 'Update Movie'}
        </Button>
      </Box>

      {movie && (
        <Card elevation={2} sx={{ overflow: 'visible', borderRadius: { xs: 1, md: 2 } }}>
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {movie?.backdropImage ? (
              <CardMedia
                component="img"
                height="320"
                image={buildTMDBImagePath(movie?.backdropImage, 'w1280')}
                alt={movie.title}
                sx={{
                  filter: 'brightness(0.65)',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                  width: '100%',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: '320px',
                  backgroundColor: 'grey.800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            )}

            {/* Overlay Content */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 100%)',
                color: 'white',
                pt: { xs: 3, sm: 4 },
                pb: { xs: 1.5, sm: 2 },
                px: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'flex-end',
                minHeight: { xs: '140px', sm: '180px' },
              }}
            >
              {/* Poster */}
              <Box
                component="img"
                sx={{
                  width: { xs: 80, sm: 120, md: 140 },
                  height: { xs: 120, sm: 180, md: 210 },
                  mr: { xs: 2, sm: 2, md: 3 },
                  borderRadius: 1,
                  boxShadow: 3,
                  transform: 'translateY(-30px)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                src={buildTMDBImagePath(movie?.posterImage, 'w500')}
                alt={movie?.title}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/300x450/gray/white?text=No+Image';
                }}
              />

              {/* Movie Details */}
              <Box sx={{ flexGrow: 1, pb: 2, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    mb: 1,
                  }}
                >
                  {movie?.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mb: 1.5,
                    opacity: 1,
                    lineHeight: 1.4,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: { xs: 3, sm: 4 },
                  }}
                >
                  <i>{movie?.description}</i>
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">
                      {movie?.releaseDate ? parseLocalDate(movie.releaseDate).getFullYear() : 'Unknown'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{formatRuntime(movie?.runtime)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2">{formatUserRating(movie?.userRating)}</Typography>
                  </Box>
                  <Chip label={movie?.mpaRating} size="small" color="primary" sx={{ fontWeight: 500 }} />
                </Box>
              </Box>
            </Box>
          </Box>

          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Streaming On
                    </Typography>
                    <Typography variant="body2">{movie?.streamingServices || 'Not available for streaming'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Director
                    </Typography>
                    <Typography variant="body2">{movie?.director || 'Unknown'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Production Companies
                    </Typography>
                    <Typography variant="body2">{movie?.productionCompanies || 'Unknown'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Genres
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {movie?.genres
                        .split(',')
                        .map((genre) => (
                          <Chip key={genre} label={genre.trim()} variant="outlined" size="small" color="primary" />
                        ))}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Box Office
                    </Typography>
                    <Typography variant="body2">{formatCurrency(movie?.revenue)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Budget
                    </Typography>
                    <Typography variant="body2">{formatCurrency(movie?.budget)}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Movie Details
                  </Typography>

                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        ID
                      </Typography>
                      <Typography variant="body2">{movie.id}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        TMDB ID
                      </Typography>
                      <Typography variant="body2">{movie.tmdbId}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">{formatFullDate(movie.lastUpdated)}</Typography>
                    </Box>
                  </>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Ratings Section */}
      <Accordion sx={{ mt: 3 }} onChange={handleRatingsAccordionChange}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
            <Typography variant="h6">Ratings</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {ratingsLoading ? (
            <Typography variant="body2" color="text.secondary">Loading ratings...</Typography>
          ) : ratingSummary ? (
            <>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Rating value={ratingSummary.averageRating} precision={0.1} readOnly />
                <Typography variant="h6">{ratingSummary.averageRating.toFixed(1)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ({ratingSummary.ratingCount} {ratingSummary.ratingCount === 1 ? 'rating' : 'ratings'})
                </Typography>
              </Box>
              <Box sx={{ maxWidth: 300, mb: 3 }}>
                {([5, 4, 3, 2, 1] as const).map((star) => (
                  <Box key={star} display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="caption" sx={{ width: 16, textAlign: 'right' }}>{star}★</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={ratingSummary.ratingCount > 0 ? (ratingSummary.distribution[star] / ratingSummary.ratingCount) * 100 : 0}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="caption" sx={{ width: 24 }}>{ratingSummary.distribution[star]}</Typography>
                  </Box>
                ))}
              </Box>
              {ratingsWithNotes && ratingsWithNotes.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Ratings with notes</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Profile</TableCell>
                          <TableCell>Stars</TableCell>
                          <TableCell>Note</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ratingsWithNotes.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>{r.profileName}</TableCell>
                            <TableCell>
                              <Rating value={r.rating} readOnly size="small" />
                            </TableCell>
                            <TableCell>
                              <Tooltip title={r.note} placement="top" arrow>
                                <Typography variant="body2" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.note}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>{formatFullDate(r.updatedAt)}</TableCell>
                            <TableCell>
                              <IconButton size="small" color="error" onClick={() => setRatingDeleteDialog(r.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">No ratings yet.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Dialog open={ratingDeleteDialog !== null} onClose={() => setRatingDeleteDialog(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this rating? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDeleteDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => ratingDeleteDialog !== null && handleDeleteRating(ratingDeleteDialog)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profiles Section */}
      {profiles && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Profiles
          </Typography>

          {profiles.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No profiles have added this movie.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Profile</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Added Date</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.profileId} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar src={profile.image ? `/uploads/profiles/${profile.image}` : undefined} sx={{ mr: 2 }}>
                            {profile.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{profile.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{profile.accountName}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getWatchStatusIcon(profile.watchStatus)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {profile.watchStatus.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatFullDate(profile.addedDate)}</TableCell>
                      <TableCell>{formatFullDate(profile.lastUpdated)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default MovieDetails;
