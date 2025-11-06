import { useEffect, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { ProfileEnhancedStatistics, ProfileStatisticsResponse } from '@ajgifford/keepwatching-types';
import { EnhancedProfileStatisticsDashboard } from '@ajgifford/keepwatching-ui';
import axios from 'axios';

interface ProfileStatisticsDialogProps {
  open: boolean;
  title: string;
  accountId: number;
  profileId: number;
  onClose: () => void;
}

const ProfileStatisticsDialog = ({ open, title, accountId, profileId, onClose }: ProfileStatisticsDialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<ProfileStatisticsResponse | null>(null);
  const [enhancedStatistics, setEnhancedStatistics] = useState<ProfileEnhancedStatistics>({});
  const [isLoadingEnhancedStats, setIsLoadingEnhancedStats] = useState(false);

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!open || !accountId || !profileId) return;

      setLoading(true);
      setIsLoadingEnhancedStats(true);

      try {
        // Fetch base statistics
        const baseResponse = await axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics`);
        setStatistics(baseResponse.data.results);

        // Fetch all enhanced statistics in parallel
        const [
          velocityRes,
          timelineRes,
          bingeRes,
          streakRes,
          timeToWatchRes,
          seasonalRes,
          milestoneRes,
          contentDepthRes,
          contentDiscoveryRes,
          abandonmentRiskRes,
          unairedContentRes,
        ] = await Promise.allSettled([
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/velocity`, {
            params: { days: 30 },
          }),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/activity/timeline`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/binge`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/streaks`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/time-to-watch`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/seasonal`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/milestones`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/content-depth`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/content-discovery`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/abandonment-risk`),
          axios.get(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics/unaired-content`),
        ]);

        // Build enhanced statistics object
        const enhanced: ProfileEnhancedStatistics = {
          velocity: velocityRes.status === 'fulfilled' ? velocityRes.value.data.results : null,
          timeline: timelineRes.status === 'fulfilled' ? timelineRes.value.data.results : null,
          binge: bingeRes.status === 'fulfilled' ? bingeRes.value.data.results : null,
          streak: streakRes.status === 'fulfilled' ? streakRes.value.data.results : null,
          timeToWatch: timeToWatchRes.status === 'fulfilled' ? timeToWatchRes.value.data.results : null,
          seasonal: seasonalRes.status === 'fulfilled' ? seasonalRes.value.data.results : null,
          milestones: milestoneRes.status === 'fulfilled' ? milestoneRes.value.data.results : null,
          contentDepth: contentDepthRes.status === 'fulfilled' ? contentDepthRes.value.data.results : null,
          contentDiscovery: contentDiscoveryRes.status === 'fulfilled' ? contentDiscoveryRes.value.data.results : null,
          abandonmentRisk: abandonmentRiskRes.status === 'fulfilled' ? abandonmentRiskRes.value.data.results : null,
          unairedContent: unairedContentRes.status === 'fulfilled' ? unairedContentRes.value.data.results : null,
        };

        setEnhancedStatistics(enhanced);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
        setIsLoadingEnhancedStats(false);
      }
    };

    if (accountId && profileId && open) {
      fetchAllStats();
    }
  }, [accountId, profileId, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <EnhancedProfileStatisticsDashboard
          accountId={accountId}
          profileId={profileId}
          statistics={statistics}
          isLoading={loading}
          enhancedStatistics={enhancedStatistics}
          isLoadingEnhancedStats={isLoadingEnhancedStats}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileStatisticsDialog;
