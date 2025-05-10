import React, { useCallback, useEffect, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { MovieData } from '../types/movieTypes';
import axios from 'axios';

interface MovieDataProviderProps {
  movieId: string;
  children: (data: MovieData, loadingState: LoadingState, refresh: () => Promise<void>) => React.ReactNode;
}

export interface LoadingState {
  isLoadingDetails: boolean;
  isLoadingProfiles: boolean;
  error: string | null;
}

/**
 * Component that handles the loading of movie data with individual loading states for each section
 * This allows for a better user experience as parts of the UI can be displayed as they load
 */
export function MovieDataProvider({ movieId, children }: MovieDataProviderProps) {
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoadingDetails: true,
    isLoadingProfiles: true,
    error: null,
  });

  const loadMovieDetails = useCallback(async () => {
    setLoadingState((prev) => ({ ...prev, isLoadingDetails: true, error: null }));
    try {
      const response = await axios.get(`/api/v1/movies/${movieId}/details`);
      setMovieData((prev) => ({
        ...(prev || { profiles: [] }),
        details: response.data.results,
      }));
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setLoadingState((prev) => ({ ...prev, error: 'Failed to load movie details' }));
    } finally {
      setLoadingState((prev) => ({ ...prev, isLoadingDetails: false }));
    }
  }, [movieId]);

  const loadMovieProfiles = useCallback(async () => {
    setLoadingState((prev) => ({ ...prev, isLoadingProfiles: true }));
    try {
      const profilesResponse = await axios.get(`/api/v1/movies/${movieId}/profiles`);
      setMovieData((prev) => ({
        ...(prev || { details: {} as any }),
        profiles: profilesResponse.data.results,
      }));
    } catch (error) {
      console.error('Error fetching movie profiles:', error);
      setLoadingState((prev) => ({ ...prev, error: 'Failed to load movie profiles' }));
    } finally {
      setLoadingState((prev) => ({ ...prev, isLoadingProfiles: false }));
    }
  }, [movieId]);

  const loadAllData = useCallback(async () => {
    await Promise.all([loadMovieDetails(), loadMovieProfiles()]);
  }, [loadMovieDetails, loadMovieProfiles]);

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Show loading indicator if all data is still loading
  if (loadingState.isLoadingDetails && loadingState.isLoadingProfiles) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={8}>
        <CircularProgress size={60} />
        <Typography variant="h6" mt={2}>
          Loading movie data...
        </Typography>
      </Box>
    );
  }

  // Show error if all requests failed
  if (loadingState.error && !movieData) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {loadingState.error}
      </Alert>
    );
  }

  // If we have at least some data, render the child component
  if (movieData) {
    return <>{children(movieData, loadingState, loadAllData)}</>;
  }

  return null;
}

export default MovieDataProvider;
