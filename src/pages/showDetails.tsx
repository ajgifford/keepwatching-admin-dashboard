import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalMoviesOutlinedIcon from '@mui/icons-material/LocalMoviesOutlined';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarIcon from '@mui/icons-material/Star';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import UpdateIcon from '@mui/icons-material/Update';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import WatchLaterTwoToneIcon from '@mui/icons-material/WatchLaterTwoTone';
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
  Grid,
  IconButton,
  LinearProgress,
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

import { ApiErrorResponse, ErrorComponent } from '../components/errorComponent';
import { LoadingComponent } from '../components/loadingComponent';
import { buildTMDBImagePath } from '../utils/utils';
import {
  AdminProfileWatchProgress,
  AdminSeasonWithEpisodes,
  AdminShow,
  ContentProfiles,
  WatchStatus,
} from '@ajgifford/keepwatching-types';
import axios, { AxiosError } from 'axios';

function ShowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [expandedSeason, setExpandedSeason] = useState<number | false>(false);
  const [expandedProfile, setExpandedProfile] = useState<number | false>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<ApiErrorResponse | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [show, setShow] = useState<AdminShow | null>(null);
  const [seasons, setSeasons] = useState<AdminSeasonWithEpisodes[] | null>(null);
  const [profiles, setProfiles] = useState<ContentProfiles[] | null>(null);
  const [watchProgress, setWatchProgress] = useState<AdminProfileWatchProgress[] | null>(null);

  const loadShowDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/shows/${id}/details`);
      setShow(response.data.results);
    } catch (error) {
      console.error('Error fetching show details:', error);
      throw error;
    }
  }, [id]);

  const loadShowSeasons = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/shows/${id}/seasonsEpisodes`);
      setSeasons(response.data.results);
    } catch (error) {
      console.error('Error fetching show seasons:', error);
      throw error;
    }
  }, [id]);

  const loadShowProfiles = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/shows/${id}/profiles`);
      setProfiles(response.data.results);
    } catch (error) {
      console.error('Error fetching show profiles:', error);
      throw error;
    }
  }, [id]);

  const loadShowWatchProgress = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/shows/${id}/watchProgress`);
      setWatchProgress(response.data.results);
    } catch (error) {
      console.error('Error fetching show watch progress:', error);
      throw error;
    }
  }, [id]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadShowDetails(), loadShowSeasons(), loadShowProfiles(), loadShowWatchProgress()]);
    } catch (error) {
      console.error('Error loading show:', error);
      if (error instanceof AxiosError) {
        setLoadingError(error.response?.data || { message: error.message });
      } else {
        setLoadingError({ message: 'An unknown error occurred fetching a show with its details' });
      }
    } finally {
      setLoading(false);
    }
  }, [loadShowDetails, loadShowSeasons, loadShowProfiles, loadShowWatchProgress]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSeasonAccordionChange = (seasonId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSeason(isExpanded ? seasonId : false);
  };

  const handleProfileAccordionChange = (profileId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedProfile(isExpanded ? profileId : false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Upcoming';

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatYear = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
    });
  };

  const formatSeasons = (seasons: number | undefined) => {
    if (seasons) {
      if (seasons === 1) {
        return '1 season';
      }
      return `${seasons} seasons`;
    }
    return 'No seasons';
  };

  const formatUserRating = (rating: number | undefined) => {
    if (rating) {
      return `${rating.toFixed(2)} / 10`;
    }
    return 'Unknown';
  };

  const buildServicesLine = (network: string | null | undefined, streamingServices: string | undefined) => {
    if (!network && !streamingServices) {
      return 'No Network or Streaming Service';
    }

    // Helper function to filter out 'Unknown' from streaming services
    const filterUnknown = (services: string) => {
      return services
        .split(',')
        .map((service) => service.trim())
        .filter((service) => service.toLowerCase() !== 'unknown')
        .join(', ');
    };

    const services = streamingServices ? filterUnknown(streamingServices) : 'No Streaming Service';
    return `${network || 'No Network'} • ${services}`;
  };

  const getWatchStatusIcon = (status: WatchStatus) => {
    switch (status) {
      case WatchStatus.WATCHED:
        return <WatchLaterIcon color="success" />;
      case WatchStatus.UP_TO_DATE:
        return <UpdateIcon color="success" />;
      case WatchStatus.WATCHING:
        return <WatchLaterTwoToneIcon color="info" />;
      case WatchStatus.NOT_WATCHED:
        return <WatchLaterOutlinedIcon color="error" />;
      case WatchStatus.UNAIRED:
        return <PendingOutlinedIcon color="info" />;
      default:
        return null;
    }
  };

  const handleUpdateShow = async (show: AdminShow | null) => {
    if (show) {
      setUpdating(true);
      try {
        await axios.post('/api/v1/shows/update', {
          showId: show.id,
          tmdbId: show.tmdbId,
        });
        await loadAllData();
      } catch (error) {
        console.error('Error updating show:', error);
      } finally {
        setUpdating(false);
      }
    }
  };

  if (!id) {
    return (
      <Box m={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Show ID is missing
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            const page = searchParams.get('page');
            if (page) {
              navigate(`/shows?page=${page}`);
            } else {
              navigate(`/shows`);
            }
          }}
        >
          Back to Shows
        </Button>
      </Box>
    );
  }

  if (loading) {
    return <LoadingComponent />;
  }
  if (loadingError) {
    return <ErrorComponent error={loadingError} />;
  }

  return (
    <Box>
      <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => {
              const page = searchParams.get('page');
              if (page) {
                navigate(`/shows?page=${page}`);
              } else {
                navigate(`/shows`);
              }
            }}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={updating ? <CircularProgress size={20} /> : <UpdateIcon />}
            onClick={() => handleUpdateShow(show)}
            disabled={updating || loading}
          >
            {updating ? 'Updating...' : 'Update Show'}
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAllData} disabled={updating || loading}>
            Refresh Data
          </Button>
        </Box>
      </Box>

      {show && (
        <Card elevation={2} sx={{ overflow: 'visible', borderRadius: { xs: 1, md: 2 } }}>
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {show?.backdropImage ? (
              <CardMedia
                component="img"
                height="320"
                image={buildTMDBImagePath(show.backdropImage, 'w1280')}
                alt={show.title}
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
                bgcolor: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 100%)',
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
                src={buildTMDBImagePath(show?.posterImage, 'w500')}
                alt={show?.title}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/300x450/gray/white?text=No+Image';
                }}
              />

              {/* Show Details */}
              <Box sx={{ flexGrow: 1, pb: 2, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    mb: 1,
                  }}
                >
                  {show?.title}
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
                    WebkitLineClamp: { xs: 5, sm: 7 },
                  }}
                >
                  <i>{show?.description}</i>
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{formatYear(show?.releaseDate)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TvOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{formatSeasons(show?.seasonCount)} </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocalMoviesOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{show?.episodeCount} Episodes</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2">{formatUserRating(show?.userRating)}</Typography>
                  </Box>
                  <Chip label={show?.contentRating} size="small" color="primary" sx={{ fontWeight: 500 }} />
                </Box>
              </Box>
            </Box>
          </Box>

          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <>
                  <Grid item xs={12} sm={6} mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Genres
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {show?.genres
                        .split(',')
                        .map((genre) => (
                          <Chip key={genre} label={genre.trim()} variant="outlined" size="small" color="primary" />
                        ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} mt={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Network • Streaming On
                      </Typography>
                      <Typography variant="body2">
                        {buildServicesLine(show?.network, show?.streamingServices)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} mt={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Show Status
                      </Typography>
                      <Typography variant="body2">{`${show?.type} • ${show?.status}`}</Typography>
                    </Box>
                  </Grid>
                </>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Show Details
                  </Typography>

                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        ID
                      </Typography>
                      <Typography variant="body2">{show.id}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        TMDB ID
                      </Typography>
                      <Typography variant="body2">{show.tmdbId}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        First Aired
                      </Typography>
                      <Typography variant="body2">{formatDate(show.releaseDate)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Aired
                      </Typography>
                      <Typography variant="body2">{formatDate(show.lastAirDate)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">{formatDate(show.lastUpdated)}</Typography>
                    </Box>
                  </>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Seasons and Episodes Section */}
      {seasons && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6">Seasons & Episodes</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {seasons.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No seasons found for this show.
              </Typography>
            ) : (
              <Box>
                {seasons.map((season) => (
                  <Accordion
                    key={season.id}
                    expanded={expandedSeason === season.id}
                    onChange={handleSeasonAccordionChange(season.id)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" width="100%">
                        <Avatar
                          variant="rounded"
                          src={`https://image.tmdb.org/t/p/w200${season.posterImage}`}
                          alt={season.name}
                          sx={{ width: 60, height: 90, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h6">{season.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {season.numberOfEpisodes} Episodes • Released: {formatDate(season.releaseDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={70}>Episode</TableCell>
                              <TableCell></TableCell>
                              <TableCell>Title</TableCell>
                              <TableCell>Air Date</TableCell>
                              <TableCell>Runtime</TableCell>
                              <TableCell>Type</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {season.episodes.map((episode) => (
                              <TableRow key={episode.id} hover>
                                <TableCell>{episode.episodeNumber}</TableCell>
                                <TableCell>
                                  <Avatar
                                    variant="rounded"
                                    src={`https://image.tmdb.org/t/p/w200${episode.stillImage}`}
                                    sx={{ width: 160, height: 90 }}
                                    alt={episode.title}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Tooltip title={episode.overview} placement="top" arrow>
                                    <Typography variant="body2">{episode.title}</Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>{formatDate(episode.airDate)}</TableCell>
                                <TableCell>{episode.runtime || 'N/A'} min</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={episode.episodeType.charAt(0).toUpperCase() + episode.episodeType.slice(1)}
                                    color={episode.episodeType === 'finale' ? 'primary' : 'default'}
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Profiles and Watch Status Section */}
      {profiles && watchProgress && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6">User Profiles & Watch Progress</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {profiles.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No profiles have added this show.
              </Typography>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Profile</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Added Date</TableCell>
                        <TableCell>Last Updated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profiles.map((profile) => {
                        const watchInfo = watchProgress.find((wp) => wp.profileId === profile.profileId);

                        return (
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
                            <TableCell width={200}>
                              <Box sx={{ width: '100%' }}>
                                {watchInfo ? (
                                  <>
                                    <LinearProgress
                                      variant="determinate"
                                      value={watchInfo.percentComplete}
                                      sx={{ height: 8, borderRadius: 1 }}
                                    />
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                      {watchInfo.watchedEpisodes} / {watchInfo.totalEpisodes} episodes (
                                      {watchInfo.percentComplete}%)
                                    </Typography>
                                  </>
                                ) : (
                                  <Typography variant="caption">No data available</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>{formatDate(profile.addedDate)}</TableCell>
                            <TableCell>{formatDate(profile.lastUpdated)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Detailed Watch Progress by Season - Now with collapsible profiles */}
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Detailed Watch Progress by Season
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {watchProgress.map((profile) => (
                    <Accordion
                      key={profile.profileId}
                      expanded={expandedProfile === profile.profileId}
                      onChange={handleProfileAccordionChange(profile.profileId)}
                      sx={{ mb: 2 }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>{profile.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="subtitle1">{profile.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {profile.watchedEpisodes} of {profile.totalEpisodes} episodes watched (
                              {profile.percentComplete}%)
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Season</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Progress</TableCell>
                                <TableCell>Episodes Watched</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {profile.seasons.map((season) => (
                                <TableRow key={season.seasonId} hover>
                                  <TableCell>{season.name}</TableCell>
                                  <TableCell>
                                    <Box display="flex" alignItems="center">
                                      {getWatchStatusIcon(season.status)}
                                      <Typography variant="body2" sx={{ ml: 1 }}>
                                        {season.status.replace('_', ' ')}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell width={200}>
                                    <Box sx={{ width: '100%' }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={season.percentComplete}
                                        sx={{ height: 8, borderRadius: 1 }}
                                      />
                                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                        {season.percentComplete}% complete
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {season.watchedEpisodes} / {season.episodeCount}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

export default ShowDetails;
