import React, { useCallback, useEffect, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import {
  AdminProfileWatchProgress,
  AdminSeasonWithEpisodes,
  AdminShow,
  ContentProfiles,
} from '@ajgifford/keepwatching-types';
import axios from 'axios';

export interface ShowData {
  details: AdminShow;
  seasons: AdminSeasonWithEpisodes[];
  profiles: ContentProfiles[];
  watchProgress: AdminProfileWatchProgress[];
}

interface ShowDataProviderProps {
  showId: string;
  children: (data: ShowData, loadingState: LoadingState, refresh: () => Promise<void>) => React.ReactNode;
}

export interface LoadingState {
  isLoadingDetails: boolean;
  isLoadingSeasons: boolean;
  isLoadingProfiles: boolean;
  error: string | null;
}

/**
 * Component that handles the loading of show data with individual loading states for each section
 * This allows for a better user experience as parts of the UI can be displayed as they load
 */
export function ShowDataProvider({ showId, children }: ShowDataProviderProps) {
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoadingDetails: true,
    isLoadingSeasons: true,
    isLoadingProfiles: true,
    error: null,
  });

  const loadShowDetails = useCallback(async () => {
    setLoadingState((prev) => ({ ...prev, isLoadingDetails: true, error: null }));
    try {
      const response = await axios.get(`/api/v1/shows/${showId}/details`);
      setShowData((prev) => ({
        ...(prev || { seasons: [], profiles: [], watchProgress: [] }),
        details: response.data.results,
      }));
    } catch (error) {
      console.error('Error fetching show details:', error);
      setLoadingState((prev) => ({ ...prev, error: 'Failed to load show details' }));
    } finally {
      setLoadingState((prev) => ({ ...prev, isLoadingDetails: false }));
    }
  }, [showId]);

  const loadShowSeasons = useCallback(async () => {
    setLoadingState((prev) => ({ ...prev, isLoadingSeasons: true }));
    try {
      const response = await axios.get(`/api/v1/shows/${showId}/seasonsEpisodes`);
      setShowData((prev) => ({
        ...(prev || { details: {} as any, profiles: [], watchProgress: [] }),
        seasons: response.data.results,
      }));
    } catch (error) {
      console.error('Error fetching show seasons:', error);
      setLoadingState((prev) => ({ ...prev, error: 'Failed to load show seasons' }));
    } finally {
      setLoadingState((prev) => ({ ...prev, isLoadingSeasons: false }));
    }
  }, [showId]);

  const loadShowProfiles = useCallback(async () => {
    setLoadingState((prev) => ({ ...prev, isLoadingProfiles: true }));
    try {
      const profilesResponse = await axios.get(`/api/v1/shows/${showId}/profiles`);
      const watchProgressResponse = await axios.get(`/api/v1/shows/${showId}/watchProgress`);

      setShowData((prev) => ({
        ...(prev || { details: {} as any, seasons: [] }),
        profiles: profilesResponse.data.results,
        watchProgress: watchProgressResponse.data.results,
      }));
    } catch (error) {
      console.error('Error fetching show profiles:', error);
      setLoadingState((prev) => ({ ...prev, error: 'Failed to load show profiles' }));
    } finally {
      setLoadingState((prev) => ({ ...prev, isLoadingProfiles: false }));
    }
  }, [showId]);

  const loadAllData = useCallback(async () => {
    await Promise.all([loadShowDetails(), loadShowSeasons(), loadShowProfiles()]);
  }, [loadShowDetails, loadShowSeasons, loadShowProfiles]);

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Show loading indicator if all data is still loading
  if (loadingState.isLoadingDetails && loadingState.isLoadingSeasons && loadingState.isLoadingProfiles) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={8}>
        <CircularProgress size={60} />
        <Typography variant="h6" mt={2}>
          Loading show data...
        </Typography>
      </Box>
    );
  }

  // Show error if all requests failed
  if (loadingState.error && !showData) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {loadingState.error}
      </Alert>
    );
  }

  // If we have at least some data, render the child component
  if (showData) {
    return <>{children(showData, loadingState, loadAllData)}</>;
  }

  return null;
}

export default ShowDataProvider;
