import { useEffect, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { AccountEnhancedStatistics, AccountStatisticsResponse } from '@ajgifford/keepwatching-types';
import { EnhancedAccountStatisticsDashboard } from '@ajgifford/keepwatching-ui';
import axios from 'axios';

interface AccountStatisticsDialogProps {
  open: boolean;
  title: string;
  accountId: number;
  onClose: () => void;
}

const AccountStatisticsDialog = ({ open, title, accountId, onClose }: AccountStatisticsDialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<AccountStatisticsResponse | null>(null);
  const [enhancedStatistics, setEnhancedStatistics] = useState<AccountEnhancedStatistics>({});
  const [isLoadingEnhancedStats, setIsLoadingEnhancedStats] = useState(false);

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!open || !accountId) return;

      setLoading(true);
      setIsLoadingEnhancedStats(true);

      try {
        // Fetch base statistics
        const baseResponse = await axios.get(`/api/v1/accounts/${accountId}/statistics`);
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
          axios.get(`/api/v1/accounts/${accountId}/statistics/velocity`, { params: { days: 30 } }),
          axios.get(`/api/v1/accounts/${accountId}/statistics/activity/timeline`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/binge`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/streaks`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/time-to-watch`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/seasonal`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/milestones`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/content-depth`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/content-discovery`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/abandonment-risk`),
          axios.get(`/api/v1/accounts/${accountId}/statistics/unaired-content`),
        ]);

        // Build enhanced statistics object
        const enhanced: AccountEnhancedStatistics = {
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

    if (accountId && open) {
      fetchAllStats();
    }
  }, [accountId, open]);

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
        <EnhancedAccountStatisticsDashboard
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

export default AccountStatisticsDialog;
