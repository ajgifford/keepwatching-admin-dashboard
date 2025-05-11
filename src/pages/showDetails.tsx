import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import UpdateIcon from '@mui/icons-material/Update';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import WatchLaterTwoToneIcon from '@mui/icons-material/WatchLaterTwoTone';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
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
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import ShowDataProvider from '../components/showDataProvider';

function ShowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedSeason, setExpandedSeason] = useState<number | false>(false);

  const handleSeasonAccordionChange = (seasonId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSeason(isExpanded ? seasonId : false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWatchStatusIcon = (status: string) => {
    switch (status) {
      case 'WATCHED':
        return <WatchLaterIcon color='success'/>
      case 'UP_TO_DATE':
        return <UpdateIcon color="success" />;
      case 'WATCHING':
        return <WatchLaterTwoToneIcon color="info" />;
      case 'NOT_WATCHED':
        return <WatchLaterOutlinedIcon color="error"/>;
      default:
        return null;
    }
  };

  if (!id) {
    return (
      <Box m={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Show ID is missing
        </Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/shows')}>
          Back to Shows
        </Button>
      </Box>
    );
  }

  return (
    <ShowDataProvider showId={id}>
      {(showData, loadingState, refreshData) => (
        <Box>
          <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => navigate('/shows')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              {loadingState.isLoadingDetails ? (
                <Skeleton variant="text" width={300} height={40} />
              ) : (
                <Typography variant="h4">{showData.details.title}</Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={
                loadingState.isLoadingDetails || loadingState.isLoadingSeasons || loadingState.isLoadingProfiles
              }
            >
              Refresh Data
            </Button>
          </Box>

          <Card sx={{ mb: 4, position: 'relative' }}>
            <Box sx={{ position: 'relative' }}>
              {loadingState.isLoadingDetails ? (
                <Skeleton variant="rectangular" height={300} width="100%" />
              ) : showData.details.backdropImage ? (
                <CardMedia
                  component="img"
                  height="300"
                  image={`https://image.tmdb.org/t/p/w1280${showData.details.backdropImage}`}
                  alt={showData.details.title}
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
                      src={`https://image.tmdb.org/t/p/w500${showData.details.posterImage}`}
                      alt={showData.details.title}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = '/placeholder-poster.png';
                      }}
                    />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {showData.details.title}
                      </Typography>
                      <Typography variant="body1">
                        <i>{showData.details.description}</i>
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                        {showData.details.releaseDate.substring(0, 4)} • {showData.details.seasonCount} Seasons •{' '}
                        {showData.details.episodeCount} Episodes
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {showData.details.network && (<Chip size="small" label={showData.details.network} color="primary" />)}
                        <Chip size="small" label={showData.details.contentRating || 'Unknown'} color="secondary" />
                        <Chip size="small" label={showData.details.type} color="warning" />
                        <Chip
                          size="small"
                          label={showData.details.status}
                          color='success'
                        />
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
                        <Typography variant="body1">{showData.details.genres}</Typography>
                      </Box>

                      <Box mt={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Available On
                        </Typography>
                        <Typography variant="body1">
                          {showData.details.streamingServices || 'Not available for streaming'}
                        </Typography>
                      </Box>

                      <Box mt={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          User Rating
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {typeof showData.details.userRating === 'number'
                            ? showData.details.userRating.toFixed(3).replace(/\.?0+$/, '')
                            : 'Unknown'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Show Details
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
                          <Skeleton variant="text" width={120} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={40} />
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
                          <Typography variant="body2">{showData.details.tmdbId}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            First Aired
                          </Typography>
                          <Typography variant="body2">{formatDate(showData.details.releaseDate)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Last Aired
                          </Typography>
                          <Typography variant="body2">{formatDate(showData.details.lastAirDate)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            In Production
                          </Typography>
                          <Typography variant="body2">{showData.details.inProduction ? 'Yes' : 'No'}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Last Updated
                          </Typography>
                          <Typography variant="body2">{formatDate(showData.details.lastUpdated)}</Typography>
                        </Box>
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Seasons and Episodes Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">Seasons & Episodes</Typography>
                {loadingState.isLoadingSeasons && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {loadingState.isLoadingSeasons ? (
                <Box>
                  {[1, 2, 3].map((placeholder) => (
                    <Box key={placeholder} mb={2}>
                      <Skeleton variant="rectangular" height={60} />
                    </Box>
                  ))}
                </Box>
              ) : showData.seasons.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No seasons found for this show.
                </Typography>
              ) : (
                <Box>
                  {showData.seasons.map((season) => (
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
                              {season.episodeCount} Episodes • Released: {formatDate(season.releaseDate)}
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

          {/* Profiles and Watch Status Section */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">User Profiles & Watch Progress</Typography>
                {loadingState.isLoadingProfiles && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {loadingState.isLoadingProfiles ? (
                <>
                  <Skeleton variant="rectangular" height={300} />
                  <Skeleton variant="text" height={40} sx={{ mt: 4 }} />
                  <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
                </>
              ) : showData.profiles.length === 0 ? (
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
                        {showData.profiles.map((profile) => {
                          const watchInfo = showData.watchProgress.find((wp) => wp.profileId === profile.profileId);

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

                  {/* Detailed Watch Progress by Season */}
                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Detailed Watch Progress by Season
                  </Typography>
                  {showData.watchProgress.map((profile) => (
                    <Box key={profile.profileId} mb={4}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar sx={{ mr: 2 }}>{profile.name.charAt(0)}</Avatar>
                        <Typography variant="subtitle1">{profile.name}</Typography>
                      </Box>

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
                      <Divider sx={{ my: 2 }} />
                    </Box>
                  ))}
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </ShowDataProvider>
  );
}

export default ShowDetails;
