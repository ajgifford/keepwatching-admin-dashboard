import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import UpdateIcon from '@mui/icons-material/Update';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { PersonDetails } from '@ajgifford/keepwatching-types';
import {
  ApiErrorResponse,
  ErrorComponent,
  LoadingComponent,
  buildTMDBImagePath,
  formatFullDate,
  formatGender,
  getGenderColor,
} from '@ajgifford/keepwatching-ui';
import axios, { AxiosError } from 'axios';

function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<ApiErrorResponse | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [person, setPerson] = useState<PersonDetails | null>(null);

  const loadPersonDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/people/${id}`);
      setPerson(response.data.results);
    } catch (error) {
      console.error('Error fetching person details:', error);
      if (error instanceof AxiosError) {
        setLoadingError(error.response?.data || { message: error.message });
      } else {
        setLoadingError({ message: 'An unknown error occurred fetching a person with their details' });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPersonDetails();
  }, [loadPersonDetails]);

  const calculateAge = (birthdate: string | null, deathdate: string | null) => {
    if (!birthdate) return null;

    const birth = new Date(birthdate);
    const end = deathdate ? new Date(deathdate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return age - 1;
    }

    return age;
  };

  const handleUpdatePerson = async (person: PersonDetails | null) => {
    if (person) {
      setUpdating(true);
      try {
        await axios.post('/api/v1/people/update', {
          personId: person.id,
          tmdbId: person.tmdbId,
        });
        await loadPersonDetails();
      } catch (error) {
        console.error('Error updating person:', error);
      } finally {
        setUpdating(false);
      }
    }
  };

  if (!id) {
    return (
      <Box m={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Person ID is missing
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            const letter = searchParams.get('letter');
            const page = searchParams.get('page');
            const queryString = new URLSearchParams();

            if (letter) queryString.set('letter', letter);
            if (page) queryString.set('page', page);

            const queryStringValue = queryString.toString();
            navigate(`/people${queryStringValue ? `?${queryStringValue}` : ''}`);
          }}
        >
          Back to Persons
        </Button>
      </Box>
    );
  }

  if (loading) {
    return <LoadingComponent message="Loading Person Details..." />;
  }
  if (loadingError) {
    return <ErrorComponent error={loadingError} homeRoute="/" homeButtonLabel="Dashboard" />;
  }

  const age = person ? calculateAge(person.birthdate, person.deathdate) : null;

  return (
    <Box>
      <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => {
              const letter = searchParams.get('letter');
              const page = searchParams.get('page');
              const queryString = new URLSearchParams();

              if (letter) queryString.set('letter', letter);
              if (page) queryString.set('page', page);

              const queryStringValue = queryString.toString();
              navigate(`/people${queryStringValue ? `?${queryStringValue}` : ''}`);
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
            onClick={() => handleUpdatePerson(person)}
            disabled={updating || loading}
          >
            {updating ? 'Updating...' : 'Update Person'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPersonDetails}
            disabled={updating || loading}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {person && (
        <Card elevation={2} sx={{ overflow: 'visible', borderRadius: { xs: 1, md: 2 } }}>
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {/* Header Background */}
            <Box
              sx={{
                height: '200px',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />

            {/* Person Info Overlay */}
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
              {/* Profile Image */}
              <Avatar
                src={buildTMDBImagePath(person?.profileImage, 'w500')}
                sx={{
                  width: { xs: 80, sm: 120, md: 140 },
                  height: { xs: 80, sm: 120, md: 140 },
                  mr: { xs: 2, sm: 2, md: 3 },
                  boxShadow: 3,
                  transform: 'translateY(-30px)',
                  fontSize: '3rem',
                }}
              >
                <PersonIcon sx={{ fontSize: 'inherit' }} />
              </Avatar>

              {/* Person Details */}
              <Box sx={{ flexGrow: 1, pb: 2, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    mb: 1,
                  }}
                >
                  {person?.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                  <Chip
                    label={formatGender(person.gender)}
                    size="small"
                    color={
                      getGenderColor(person.gender) as
                        | 'default'
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'info'
                        | 'success'
                        | 'warning'
                    }
                    sx={{ fontWeight: 500 }}
                  />
                  {age && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        {person.deathdate ? `${age} years (deceased)` : `${age} years old`}
                      </Typography>
                    </Box>
                  )}
                  {person.placeOfBirth && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">{person.placeOfBirth}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="h6" gutterBottom>
                  Biography
                </Typography>
                <Typography variant="body1" paragraph>
                  {person.biography || 'No biography available.'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Person Details
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body2">{person.id}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      TMDB ID
                    </Typography>
                    <Typography variant="body2">{person.tmdbId}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Birth Date
                    </Typography>
                    <Typography variant="body2">{formatFullDate(person.birthdate)}</Typography>
                  </Box>

                  {person.deathdate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Death Date
                      </Typography>
                      <Typography variant="body2">{formatFullDate(person.deathdate)}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Credits Section */}
      {person?.movieCredits && person?.showCredits && (
        <>
          {/* Movie Credits */}
          {person?.movieCredits && person?.movieCredits.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Movie Credits ({person?.movieCredits.length})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Character</TableCell>
                      <TableCell>Released</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {person?.movieCredits
                      .sort((a, b) => {
                        if (!a.year && !b.year) return 0;
                        if (!a.year) return 1;
                        if (!b.year) return -1;
                        return parseInt(b.year) - parseInt(a.year);
                      })
                      .map((credit, index) => (
                        <TableRow key={`${credit.name}-${index}`} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar
                                src={buildTMDBImagePath(credit.poster, 'w92')}
                                variant="rounded"
                                sx={{ width: 40, height: 60, mr: 2 }}
                              />
                              <Typography variant="body2">{credit.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{credit.character || 'Unknown'}</TableCell>
                          <TableCell>{credit.year}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Show Credits */}
          {person?.showCredits && person?.showCredits.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                TV Show Credits ({person?.showCredits.length})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Character</TableCell>
                      <TableCell>Released</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {person?.showCredits
                      .sort((a, b) => {
                        if (!a.year && !b.year) return 0;
                        if (!a.year) return 1;
                        if (!b.year) return -1;
                        return parseInt(b.year) - parseInt(a.year);
                      })
                      .map((credit, index) => (
                        <TableRow key={`${credit.name}-${index}`} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar
                                src={buildTMDBImagePath(credit.poster, 'w92')}
                                variant="rounded"
                                sx={{ width: 40, height: 60, mr: 2 }}
                              />
                              <Typography variant="body2">{credit.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{credit.character || 'Unknown'}</TableCell>
                          <TableCell>{credit.year}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* No Credits */}
          {(!person?.showCredits || person?.showCredits.length === 0) &&
            (!person?.movieCredits || person?.movieCredits.length === 0) && (
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Credits
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  No credits found for this person.
                </Typography>
              </Paper>
            )}
        </>
      )}
    </Box>
  );
}

export default PersonDetail;
