import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Info as InfoIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { PaginationInfo, SelectedContent } from '../types/contentTypes';
import { AdminPerson } from '@ajgifford/keepwatching-types';
import { formatDateDisplay, formatGender, getGenderColor } from '@ajgifford/keepwatching-ui';
import axios from 'axios';

interface ApiResponse {
  message: string;
  pagination: PaginationInfo;
  results: AdminPerson[];
}

const ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

export default function People() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [persons, setPersons] = useState<AdminPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1); // API uses 1-based indexing
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [updatingPerson, setUpdatingPerson] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const rowsPerPage = 50;

  // Initialize state from URL parameters on component mount
  useEffect(() => {
    const letterParam = searchParams.get('letter');
    const pageParam = searchParams.get('page');

    if (letterParam && ALPHABET.includes(letterParam)) {
      setSelectedLetter(letterParam);
    }

    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setPage(pageNumber);
      }
    }
  }, []);

  useEffect(() => {
    fetchPersons();
  }, [page, selectedLetter]);

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(
        `/api/v1/people?page=${page}&limit=${rowsPerPage}&firstLetter=${selectedLetter}`,
      );
      setPersons(response.data.results);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (person: AdminPerson) => {
    if (updatingPerson) return;

    if (selected && selected.id === person.id && selected.tmdbId === person.tmdbId) {
      setSelected(null);
    } else {
      setSelected({
        id: person.id,
        tmdbId: person.tmdbId,
      });
    }
  };

  const isSelected = (person: AdminPerson) => {
    return selected !== null && selected.id === person.id && selected.tmdbId === person.tmdbId;
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    if (updatingPerson) return;
    setPage(newPage);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', newPage.toString());
    setSearchParams(newSearchParams);
  };

  const handleLetterChange = (letter: string) => {
    if (updatingPerson) return;
    setSelectedLetter(letter);
    setPage(1);
    setSelected(null);

    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('letter', letter);
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
  };

  const handleCheckForUpdates = async () => {
    if (selected === null) {
      setUpdateMessage('Please select a person');
      setShowMessage(true);
      return;
    }

    setUpdatingPerson(true);
    try {
      await axios.post('/api/v1/persons/update', {
        personId: selected.id,
        tmdbId: selected.tmdbId,
      });

      await fetchPersons();

      const updatedPerson = persons.find((person) => person.id === selected.id);
      if (updatedPerson) {
        setSelected({
          id: updatedPerson.id,
          tmdbId: updatedPerson.tmdbId,
        });
      }

      setUpdateMessage('Successfully checked for updates for the selected person');
      setShowMessage(true);
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateMessage('Error checking for updates. Please try again.');
      setShowMessage(true);
    } finally {
      setUpdatingPerson(false);
    }
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  return (
    <Box sx={{ width: '100%', padding: 3, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>
        People
      </Typography>

      {/* Alphabet Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter by Name
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {ALPHABET.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleLetterChange(letter)}
              disabled={updatingPerson}
              sx={{ minWidth: '40px' }}
            >
              {letter}
            </Button>
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          Showing {pagination?.totalCount} names starting with &quot;{selectedLetter}&quot;
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckForUpdates}
            disabled={selected === null || updatingPerson}
            startIcon={updatingPerson ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {updatingPerson ? 'Updating...' : 'Update Person'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer
          sx={{
            opacity: updatingPerson ? 0.6 : 1,
            pointerEvents: updatingPerson ? 'none' : 'auto',
            position: 'relative',
          }}
        >
          {loading || updatingPerson ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Birth Date</TableCell>
                  <TableCell>Place of Birth</TableCell>
                  <TableCell>Death Date</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {persons.map((person) => {
                  const isItemSelected = isSelected(person);
                  return (
                    <TableRow
                      hover
                      onClick={() => handleClick(person)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={person.id}
                      selected={isItemSelected}
                      sx={{
                        cursor: updatingPerson ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} disabled={updatingPerson} />
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {person.name}
                      </TableCell>
                      <TableCell>
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
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDateDisplay(person.birthdate)}</TableCell>
                      <TableCell>{person.placeOfBirth || 'Unknown'}</TableCell>
                      <TableCell>
                        {person.deathdate ? (
                          formatDateDisplay(person.deathdate)
                        ) : (
                          <Chip label="Living" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(person.lastUpdated).toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          component={Link}
                          to={`/people/${person.id}?letter=${selectedLetter}&page=${page}`}
                          onClick={(e) => e.stopPropagation()} // Prevent row selection when clicking the button
                          size="small"
                          color="primary"
                          title="View Details"
                        >
                          <InfoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={pagination?.totalPages || 0}
            page={pagination?.currentPage || 1}
            onChange={handleChangePage}
            disabled={updatingPerson}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseMessage}
          severity={updateMessage?.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {updateMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
