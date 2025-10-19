import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Movie as MovieIcon,
  Refresh as RefreshIcon,
  Tv as TvIcon,
} from '@mui/icons-material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  deleteAccount,
  deleteProfile,
  editAccount,
  fetchProfilesForAccount,
  selectAccountById,
  selectProfilesForAccount,
  updateProfileName,
  verifyEmail,
} from '../app/slices/accountsSlice';
import { ErrorComponent } from '../components/errorComponent';
import { LoadingComponent } from '../components/loadingComponent';
import { buildTMDBImagePath } from '../utils/utils';
import {
  AccountStatisticsResponse,
  AdminMovie,
  AdminProfile,
  AdminShow,
  CombinedAccount,
  ProfileStatisticsResponse,
} from '@ajgifford/keepwatching-types';
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

interface ProfileStatisticsApiResponse {
  message: string;
  results: ProfileStatisticsResponse;
}

interface AccountStatisticsApiResponse {
  message: string;
  results: AccountStatisticsResponse;
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
  const [accountStats, setAccountStats] = useState<AccountStatisticsResponse | null>(null);
  const [accountStatsLoading, setAccountStatsLoading] = useState(false);

  const [editingAccount, setEditingAccount] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [accountIdToDelete, setAccountIdToDelete] = useState<number | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<{ accountId: number; profileId: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);

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

  useEffect(() => {
    const loadAccountStatistics = async () => {
      setAccountStatsLoading(true);
      try {
        const response = await axios.get<AccountStatisticsApiResponse>(`/api/v1/accounts/${accountId}/statistics`);
        setAccountStats(response.data.results);
      } catch (err) {
        console.error('Failed to load account statistics:', err);
        setAccountStats(null);
      } finally {
        setAccountStatsLoading(false);
      }
    };

    if (accountId) {
      loadAccountStatistics();
    }
  }, [accountId]);

  const loadProfileStats = useCallback(async (profile: AdminProfile) => {
    setStatsLoading(true);
    try {
      const [statsRes, showsRes, moviesRes] = await Promise.all([
        axios.get<ProfileStatisticsApiResponse>(
          `/api/v1/accounts/${profile.accountId}/profiles/${profile.id}/statistics`,
        ),
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

  const handleAccountNameUpdate = () => {
    if (!account) return;
    dispatch(editAccount({ accountId: account.id, defaultProfileId: account.defaultProfileId!, name: newName }));
    setEditingAccount(false);
    setNewName('');
  };

  const handleProfileNameUpdate = () => {
    if (!editingProfile) return;
    dispatch(
      updateProfileName({
        accountId: editingProfile.accountId,
        profileId: editingProfile.id,
        name: newName,
      }),
    );
    setEditingProfile(null);
    setNewName('');
  };

  const handleDeleteAccount = () => {
    if (!accountIdToDelete) return;
    dispatch(deleteAccount(accountIdToDelete));
    setAccountIdToDelete(null);
    navigate('/accounts');
  };

  const handleDeleteProfile = () => {
    if (!profileToDelete) return;
    const { accountId, profileId } = profileToDelete;

    if (account?.defaultProfileId === profileId) {
      setMessage({ text: 'Cannot delete default profile', severity: 'error' });
      setShowMessage(true);
      setProfileToDelete(null);
      return;
    }

    dispatch(deleteProfile({ accountId, profileId }));
    setProfileToDelete(null);
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(null);
      setProfileStats(null);
    }
  };

  const handleVerifyEmail = (account: CombinedAccount) => {
    if (account && account.uid) {
      dispatch(verifyEmail(account.uid));
    }
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  if (loading) {
    return <LoadingComponent />;
  }

  if (error || !account) {
    return <ErrorComponent error={error || 'Account not found'} />;
  }

  const basicAccountInfo: AccountStats = {
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
            <Box flexGrow={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5">{account.name}</Typography>
                  <Typography variant="body1" color="textSecondary">
                    {account.email}
                  </Typography>
                  {!basicAccountInfo.emailVerified && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Email not verified
                    </Alert>
                  )}
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title="Edit Account Name" placement="top">
                    <IconButton
                      onClick={() => {
                        setEditingAccount(true);
                        setNewName(account.name);
                      }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Verify Email" placement="top">
                    <IconButton
                      color="secondary"
                      disabled={account.emailVerified}
                      onClick={() => {
                        handleVerifyEmail(account);
                      }}
                      size="small"
                    >
                      <VerifiedUserIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Account" placement="top">
                    <IconButton
                      onClick={() => {
                        setAccountIdToDelete(account.id);
                      }}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Total Profiles
                </Typography>
                <Typography variant="h6">{basicAccountInfo.totalProfiles}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Account Created
                </Typography>
                <Typography variant="h6">{new Date(basicAccountInfo.accountCreatedAt).toLocaleDateString()}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Last Login
                </Typography>
                <Typography variant="h6">
                  {basicAccountInfo.lastLogin ? new Date(basicAccountInfo.lastLogin).toLocaleDateString() : 'Never'}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="textSecondary">
                  Last Activity
                </Typography>
                <Typography variant="h6">
                  {basicAccountInfo.lastActivity
                    ? new Date(basicAccountInfo.lastActivity).toLocaleDateString()
                    : 'None'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Account-wide Statistics */}
          {accountStatsLoading ? (
            <Box display="flex" justifyContent="center" py={4} mt={3}>
              <CircularProgress />
            </Box>
          ) : accountStats ? (
            <Box mt={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Account Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="primary.contrastText">
                      Unique Shows
                    </Typography>
                    <Typography variant="h5" color="primary.contrastText">
                      {accountStats.uniqueContent.showCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="primary.contrastText">
                      Show Progress
                    </Typography>
                    <Typography variant="h5" color="primary.contrastText">
                      {accountStats.showStatistics.watchProgress}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="primary.contrastText">
                      Episodes Watched
                    </Typography>
                    <Typography variant="h5" color="primary.contrastText">
                      {accountStats.episodeStatistics.watchedEpisodes}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="primary.contrastText">
                      Episode Progress
                    </Typography>
                    <Typography variant="h5" color="primary.contrastText">
                      {accountStats.episodeStatistics.watchProgress}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="primary.contrastText">
                      Unique Movies
                    </Typography>
                    <Typography variant="h5" color="success.contrastText">
                      {accountStats.uniqueContent.movieCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="success.contrastText">
                      Movie Progress
                    </Typography>
                    <Typography variant="h5" color="success.contrastText">
                      {accountStats.movieStatistics.watchProgress}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </CardContent>
      </Card>

      {/* Profiles Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Profiles
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {profiles.map((profile) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={profile.id}>
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
                <Box display="flex" flexDirection="column" alignItems="center" flexGrow={1} position="relative">
                  <Box position="absolute" top={0} right={0} display="flex" gap={0.5}>
                    <Tooltip title="Edit Profile Name" placement="top">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProfile(profile);
                          setNewName(profile.name);
                        }}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Profile" placement="top">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileToDelete({ accountId: account.id, profileId: profile.id });
                        }}
                        size="small"
                        color="error"
                        disabled={account.defaultProfileId === profile.id}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Shows
                      </Typography>
                      <Typography variant="h6">{profileStats.showStatistics.total}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Shows In Progress
                      </Typography>
                      <Typography variant="h6">{profileStats.showStatistics.watchStatusCounts.watching}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Episodes Watched
                      </Typography>
                      <Typography variant="h6">{profileStats.episodeWatchProgress.watchedEpisodes}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Movies
                      </Typography>
                      <Typography variant="h6">{profileStats.movieStatistics.total}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
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
                          <Grid size={{ xs: 4, sm: 3, md: 2, lg: 1.5 }} key={show.id}>
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
                          <Grid size={{ xs: 4, sm: 3, md: 2, lg: 1.5 }} key={movie.id}>
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

      {/* Account Name Edit Dialog */}
      <Dialog open={editingAccount} onClose={() => setEditingAccount(false)}>
        <DialogTitle>Edit Account Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Account Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAccount(false)}>Cancel</Button>
          <Button onClick={handleAccountNameUpdate}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Profile Name Edit Dialog */}
      <Dialog open={editingProfile !== null} onClose={() => setEditingProfile(null)}>
        <DialogTitle>Edit Profile Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Profile Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProfile(null)}>Cancel</Button>
          <Button onClick={handleProfileNameUpdate}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={accountIdToDelete !== null} onClose={() => setAccountIdToDelete(null)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this account? This action cannot be undone and will delete all associated
            profiles.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountIdToDelete(null)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Profile Confirmation Dialog */}
      <Dialog open={profileToDelete !== null} onClose={() => setProfileToDelete(null)}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this profile? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileToDelete(null)}>Cancel</Button>
          <Button onClick={handleDeleteProfile} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseMessage} severity={message?.severity || 'info'} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AccountDetails;
