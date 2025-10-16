import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ArrowBack as ArrowBackIcon,
  Movie as MovieIcon,
  Refresh as RefreshIcon,
  Tv as TvIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProfilesForAccount, selectAccountById, selectProfilesForAccount } from '../app/slices/accountsSlice';
import { ErrorComponent } from '../components/errorComponent';
import { LoadingComponent } from '../components/loadingComponent';
import { buildTMDBImagePath } from '../utils/utils';
import { AdminMovie, AdminProfile, AdminShow, ProfileStatisticsResponse } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ShowsResponse {
  message: string;
  pagination: PaginationInfo;
  results: AdminShow[];
}

interface MoviesResponse {
  message: string;
  pagination: PaginationInfo;
  results: AdminMovie[];
}

interface StatisticsResponse {
  message: string;
  results: ProfileStatisticsResponse;
}

interface AccountStats {
  totalProfiles: number;
  accountCreatedAt: string;
  lastLogin: Date | null;
  lastActivity: Date | null;
  emailVerified: boolean;
}

function AccountDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const accountId = parseInt(id || '0');

  const account = useAppSelector((state) => selectAccountById(state, accountId));
  const profiles = useAppSelector((state) => selectProfilesForAccount(state, accountId));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStatisticsResponse | null>(null);
  const [watchedShows, setWatchedShows] = useState<AdminShow[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<AdminMovie[]>([]);
  const [showsPagination, setShowsPagination] = useState<PaginationInfo | null>(null);
  const [moviesPagination, setMoviesPagination] = useState<PaginationInfo | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const loadAccountData = async () => {
      if (!account) {
        setError('Account not found');
        setLoading(false);
        return;
      }

      try {
        await dispatch(fetchProfilesForAccount(accountId)).unwrap();
        setLoading(false);
      } catch (err) {
        setError('Failed to load account profiles');
        setLoading(false);
      }
    };

    loadAccountData();
  }, [accountId, account, dispatch]);

  const loadProfileStats = useCallback(async (profile: AdminProfile) => {
    setStatsLoading(true);
    try {
      const [statsRes, showsRes, moviesRes] = await Promise.all([
        axios.get<StatisticsResponse>(`/api/v1/accounts/${profile.accountId}/profiles/${profile.id}/statistics`),
        axios.get<ShowsResponse>(`/api/v1/accounts/${profile.accountId}/profiles/${profile.id}/shows`),
        axios.get<MoviesResponse>(`/api/v1/accounts/${profile.accountId}/profiles/${profile.id}/movies`),
      ]);

      setProfileStats(statsRes.data.results);
      setWatchedShows(showsRes.data.results);
      setShowsPagination(showsRes.data.pagination);
      setWatchedMovies(moviesRes.data.results);
      setMoviesPagination(moviesRes.data.pagination);
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setProfileStats(null);
      setWatchedShows([]);
      setWatchedMovies([]);
      setShowsPagination(null);
      setMoviesPagination(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleProfileClick = (profile: AdminProfile) => {
    setSelectedProfile(profile);
    loadProfileStats(profile);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return <LoadingComponent />;
  }

  if (error || !account) {
    return <ErrorComponent error={error || 'Account not found'} />;
  }

  const accountStats: AccountStats = {
    totalProfiles: profiles.length,
    accountCreatedAt: account.metadata.creationTime,
    lastLogin: account.lastLogin,
    lastActivity: account.lastActivity,
    emailVerified: account.emailVerified,
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/accounts')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Account Details
        </Typography>
      </Box>

      {/* Account Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar src={account.image || undefined} sx={{ width: 80, height: 80, mr: 3 }}>
              {account.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h5">{account.name}</Typography>
              <Typography variant="body1" color="textSecondary">
                {account.email}
              </Typography>
              {!accountStats.emailVerified && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Email not verified
                </Alert>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Total Profiles
                </Typography>
                <Typography variant="h6">{accountStats.totalProfiles}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Account Created
                </Typography>
                <Typography variant="h6">{new Date(accountStats.accountCreatedAt).toLocaleDateString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Last Login
                </Typography>
                <Typography variant="h6">
                  {accountStats.lastLogin ? new Date(accountStats.lastLogin).toLocaleDateString() : 'Never'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Last Activity
                </Typography>
                <Typography variant="h6">
                  {accountStats.lastActivity ? new Date(accountStats.lastActivity).toLocaleDateString() : 'None'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Profiles Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Profiles
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {profiles.map((profile) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={profile.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedProfile?.id === profile.id ? '2px solid' : 'none',
                borderColor: 'primary.main',
                transition: 'all 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => handleProfileClick(profile)}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" flexDirection="column" alignItems="center" flexGrow={1}>
                  <Avatar src={profile.image} sx={{ width: 100, height: 100, mb: 2 }}>
                    {profile.name[0]}
                  </Avatar>
                  <Typography variant="h6" align="center">
                    {profile.name}
                  </Typography>
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {account.defaultProfileId === profile.id && (
                      <Typography variant="caption" color="primary">
                        Default Profile
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" justifyContent="space-around" width="100%" mt={2}>
                    <Box textAlign="center">
                      <TvIcon color="action" />
                      <Typography variant="body2">{profile.favoritedShows || 0}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <MovieIcon color="action" />
                      <Typography variant="body2">{profile.favoritedMovies || 0}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Profile Details Section */}
      {selectedProfile && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">{selectedProfile.name}'s Activity</Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={() => loadProfileStats(selectedProfile)}
                disabled={statsLoading}
              >
                Refresh
              </Button>
            </Box>

            {statsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : profileStats ? (
              <>
                {/* Profile Statistics */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Shows
                      </Typography>
                      <Typography variant="h6">{profileStats.showStatistics.total}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Shows In Progress
                      </Typography>
                      <Typography variant="h6">{profileStats.showStatistics.watchStatusCounts.watching}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Episodes Watched
                      </Typography>
                      <Typography variant="h6">{profileStats.episodeWatchProgress.watchedEpisodes}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Movies
                      </Typography>
                      <Typography variant="h6">{profileStats.movieStatistics.total}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Movies Watched
                      </Typography>
                      <Typography variant="h6">{profileStats.movieStatistics.watchStatusCounts.watched}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Tabs for Shows/Movies */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label={`Shows (${showsPagination?.totalCount || 0})`} />
                    <Tab label={`Movies (${moviesPagination?.totalCount || 0})`} />
                  </Tabs>
                </Box>

                {/* Shows Tab */}
                {activeTab === 0 && (
                  <Box sx={{ mt: 2 }}>
                    {watchedShows.length === 0 ? (
                      <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        No shows watched yet
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {watchedShows.map((show) => (
                          <Grid item xs={4} sm={3} md={2} lg={1.5} key={show.id}>
                            <Card
                              sx={{
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 3 },
                              }}
                              onClick={() => navigate(`/shows/${show.id}?from=account&accountId=${accountId}`)}
                            >
                              <Box
                                component="img"
                                src={buildTMDBImagePath(show.posterImage, 'w342')}
                                alt={show.title}
                                sx={{
                                  width: '100%',
                                  height: 'auto',
                                  aspectRatio: '2/3',
                                  objectFit: 'cover',
                                }}
                              />
                              <CardContent sx={{ p: 1.5 }}>
                                <Typography variant="body2" noWrap title={show.title}>
                                  {show.title}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {show.seasonCount} seasons • {show.episodeCount} episodes
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Movies Tab */}
                {activeTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    {watchedMovies.length === 0 ? (
                      <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        No movies watched yet
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {watchedMovies.map((movie) => (
                          <Grid item xs={4} sm={3} md={2} lg={1.5} key={movie.id}>
                            <Card
                              sx={{
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 3 },
                              }}
                              onClick={() => navigate(`/movies/${movie.tmdbId}`)}
                            >
                              <Box
                                component="img"
                                src={buildTMDBImagePath(movie.posterImage, 'w342')}
                                alt={movie.title}
                                sx={{
                                  width: '100%',
                                  height: 'auto',
                                  aspectRatio: '2/3',
                                  objectFit: 'cover',
                                }}
                              />
                              <CardContent sx={{ p: 1.5 }}>
                                <Typography variant="body2" noWrap title={movie.title}>
                                  {movie.title}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Unknown'}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">Select a profile to view their statistics and watch history</Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default AccountDetails;
