import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import WatchLaterIcon from '@mui/icons-material/WatchLater';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import WatchLaterTwoToneIcon from '@mui/icons-material/WatchLaterTwoTone';
import {
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  RemoveCircle as RemoveCircleIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import MovieDataProvider from '../components/movieDataProvider';
import axios from 'axios';

function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getWatchStatusIcon = (status: string) => {
    switch (status) {
      case 'WATCHED':
        return <WatchLaterIcon color="success" />;
      case 'WATCHING':
        return <WatchLaterTwoToneIcon color="info" />;
      case 'NOT_WATCHED':
        return <WatchLaterOutlinedIcon color="error" />;
      default:
        return null;
    }
  };

  const handleUpdateMovie = async (movieId: number, tmdbId: number, refreshData: () => Promise<void>) => {
    setUpdating(true);
    try {
      await axios.post('/api/v1/movies/update', {
        movieId,
        tmdbId,
      });
      await refreshData();
    } catch (error) {
      console.error('Error updating movie:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (!id) {
    return (
      <Box m={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Movie ID is missing
        </Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/movies')}>
          Back to Movies
        </Button>
      </Box>
    );
  }

  return (
    <MovieDataProvider movieId={id}>
      {(movieData, loadingState, refreshData) => (
        <Box>
          <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => navigate('/movies')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              {loadingState.isLoadingDetails ? (
                <Skeleton variant="text" width={300} height={40} />
              ) : (
                <Typography variant="h4">{movieData.details.title}</Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={updating ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={() => handleUpdateMovie(movieData.details.id, movieData.details.tmdbId, refreshData)}
              disabled={updating || loadingState.isLoadingDetails}
            >
              {updating ? 'Updating...' : 'Update Movie'}
            </Button>
          </Box>

          <Card sx={{ mb: 4, position: 'relative' }}>
            <Box sx={{ position: 'relative' }}>
              {loadingState.isLoadingDetails ? (
                <Skeleton variant="rectangular" height={300} width="100%" />
              ) : movieData.details.backdropImage ? (
                <CardMedia
                  component="img"
                  height="300"
                  image={`https://image.tmdb.org/t/p/w1280${movieData.details.backdropImage}`}
                  alt={movieData.details.title}
                  sx={{ filter: 'brightness(0.7)' }}
                />
              ) : (
                <Box
                  sx={{
                    height: '300px',
                    backgroundColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    No backdrop image available
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                {loadingState.isLoadingDetails ? (
                  <>
                    <Skeleton variant="rectangular" width={140} height={210} sx={{ mr: 3, borderRadius: 1 }} />
                    <Box>
                      <Skeleton variant="text" width={200} height={40} />
                      <Skeleton variant="text" width={280} height={20} sx={{ mt: 1, mb: 2 }} />
                      <Box display="flex" gap={1}>
                        <Skeleton variant="rectangular" width={60} height={24} />
                        <Skeleton variant="rectangular" width={60} height={24} />
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box
                      component="img"
                      sx={{
                        width: 140,
                        height: 210,
                        mr: 3,
                        borderRadius: 1,
                        boxShadow: 3,
                        transform: 'translateY(-30px)',
                      }}
                      src={`https://image.tmdb.org/t/p/w500${movieData.details.posterImage}`}
                      alt={movieData.details.title}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = '/placeholder-poster.png';
                      }}
                    />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {movieData.details.title}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        <i>{movieData.details.description}</i>
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                        {movieData.details.releaseDate.substring(0, 4)} • {formatRuntime(movieData.details.runtime)}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip size="small" label={movieData.details.streamingServices} color="primary" />
                        <Chip size="small" label={movieData.details.mpaRating || 'Unknown'} color="secondary" />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {loadingState.isLoadingDetails ? (
                    <>
                      <Skeleton variant="text" height={100} />
                      <Skeleton variant="text" height={20} width="40%" sx={{ mt: 2 }} />
                      <Skeleton variant="text" height={20} width="90%" />
                      <Skeleton variant="text" height={20} width="40%" sx={{ mt: 2 }} />
                      <Skeleton variant="text" height={20} width="70%" />
                    </>
                  ) : (
                    <>
                      <Box mt={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Genres
                        </Typography>
                        <Typography variant="body1">{movieData.details.genres}</Typography>
                      </Box>

                      <Box mt={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Available On
                        </Typography>
                        <Typography variant="body1">
                          {movieData.details.streamingServices || 'Not available for streaming'}
                        </Typography>
                      </Box>
                      <Box mt={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          User Rating
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {typeof movieData.details.userRating === 'number'
                            ? movieData.details.userRating.toFixed(3).replace(/\.?0+$/, '')
                            : 'Unknown'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Movie Details
                    </Typography>

                    {loadingState.isLoadingDetails ? (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={80} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={120} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={60} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={120} />
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            TMDB ID
                          </Typography>
                          <Typography variant="body2">{movieData.details.tmdbId}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Release Date
                          </Typography>
                          <Typography variant="body2">{formatDate(movieData.details.releaseDate)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Runtime
                          </Typography>
                          <Typography variant="body2">{formatRuntime(movieData.details.runtime)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Last Updated
                          </Typography>
                          <Typography variant="body2">{formatDate(movieData.details.lastUpdated)}</Typography>
                        </Box>
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Profiles Section */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Profiles
            </Typography>

            {loadingState.isLoadingProfiles ? (
              <Skeleton variant="rectangular" height={200} />
            ) : movieData.profiles.length === 0 ? (
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
                    {movieData.profiles.map((profile) => (
                      <TableRow key={profile.profileId} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              src={profile.image ? `/uploads/profiles/${profile.image}` : undefined}
                              sx={{ mr: 2 }}
                            >
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
                        <TableCell>{formatDate(profile.addedDate)}</TableCell>
                        <TableCell>{formatDate(profile.lastUpdated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}
    </MovieDataProvider>
  );
}

export default MovieDetails;
