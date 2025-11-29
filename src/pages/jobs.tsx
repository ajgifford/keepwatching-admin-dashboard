import { useEffect, useState } from 'react';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScheduleIcon from '@mui/icons-material/Schedule';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';

import ChangeFrequencyDialog from '../components/changeFrequencyDialog';
import { cronToHumanReadable } from '../utils/cronUtils';
import { JobStatusResponse } from '@ajgifford/keepwatching-types';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

export default function Jobs() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobStatusResponse | null>(null);
  const [paused, setPaused] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ name: string; key: keyof JobStatusResponse } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = async () => {
    try {
      const response = await axios.get<JobStatusResponse>('/api/v1/admin/jobs/status');
      setJobs(response.data);
      setPaused(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setSnackbar({ open: true, message: 'Failed to fetch jobs status', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteJob = async (jobKey: keyof JobStatusResponse) => {
    try {
      await axios.post(`/api/v1/admin/jobs/execute?jobName=${jobKey}`);
      setSnackbar({ open: true, message: `Job ${jobKey} executed successfully`, severity: 'success' });
      fetchData();
    } catch (error) {
      console.error(`Error executing job ${jobKey}:`, error);
      setSnackbar({ open: true, message: `Failed to execute job ${jobKey}`, severity: 'error' });
    }
  };

  const handlePauseJobs = async () => {
    try {
      await axios.post('/api/v1/admin/jobs/pause');
      setSnackbar({ open: true, message: 'All jobs paused', severity: 'success' });
      setPaused(true);
      fetchData();
    } catch (error) {
      console.error('Error pausing jobs:', error);
      setSnackbar({ open: true, message: 'Failed to pause jobs', severity: 'error' });
    }
  };

  const handleResumeJobs = async () => {
    try {
      await axios.post('/api/v1/admin/jobs/resume');
      setSnackbar({ open: true, message: 'All jobs resumed', severity: 'success' });
      setPaused(false);
      fetchData();
    } catch (error) {
      console.error('Error resuming jobs:', error);
      setSnackbar({ open: true, message: 'Failed to resume jobs', severity: 'error' });
    }
  };

  const handleChangeFrequency = async (newCron: string) => {
    if (!selectedJob) return;

    try {
      await axios.put(`/api/v1/admin/jobs/update-schedule?jobName=${selectedJob.key}`, { cronExpression: newCron });
      setSnackbar({
        open: true,
        message: `Frequency updated for ${selectedJob.name}`,
        severity: 'success',
      });
      fetchData();
    } catch (error) {
      console.error(`Error updating frequency for ${selectedJob.key}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to update frequency for ${selectedJob.name}`,
        severity: 'error',
      });
    }
  };

  const formatJobName = (key: string): string => {
    const names: Record<string, string> = {
      showsUpdate: 'Shows Update',
      moviesUpdate: 'Movies Update',
      peopleUpdate: 'People Update',
      emailDigest: 'Email Digest',
      performanceArchive: 'Performance Archive',
    };
    return names[key] || key;
  };

  const formatDateTime = (dateTime: string | null): string => {
    if (!dateTime) return 'Never';
    try {
      return format(parseISO(dateTime), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateTime;
    }
  };

  const getStatusChipProps = (status: string | null) => {
    switch (status) {
      case 'success':
        return { label: 'Success', color: 'success' as const };
      case 'failed':
        return { label: 'Failed', color: 'error' as const };
      case 'never_run':
        return { label: 'Never Run', color: 'default' as const };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography component="h1" variant="h5" color="primary" gutterBottom>
          Scheduled Jobs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {paused ? (
            <Button variant="contained" color="success" onClick={handleResumeJobs}>
              Resume All Jobs
            </Button>
          ) : (
            <Button variant="contained" color="warning" onClick={handlePauseJobs}>
              Pause All Jobs
            </Button>
          )}
        </Box>
      </Box>

      {paused && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          All jobs are currently paused
        </Alert>
      )}

      <Grid container spacing={3}>
        {jobs &&
          Object.entries(jobs).map(([key, job]) => (
            <Grid key={key} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {formatJobName(key)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {job.isRunning && (
                        <Chip label="Running" color="primary" size="small" icon={<CircularProgress size={16} />} />
                      )}
                      {!job.isRunning && job.lastRunStatus && getStatusChipProps(job.lastRunStatus) && (
                        <Chip
                          label={getStatusChipProps(job.lastRunStatus)!.label}
                          size="small"
                          color={getStatusChipProps(job.lastRunStatus)!.color}
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Schedule:
                    </Typography>
                    <Typography variant="body1">{cronToHumanReadable(job.cronExpression)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.cronExpression}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Run:
                    </Typography>
                    <Typography variant="body2">{formatDateTime(job.lastRunTime)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Next Run:
                    </Typography>
                    <Typography variant="body2">{formatDateTime(job.nextRunTime)}</Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleExecuteJob(key as keyof JobStatusResponse)}
                    disabled={job.isRunning || paused}
                  >
                    Execute
                  </Button>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setSelectedJob({ name: formatJobName(key), key: key as keyof JobStatusResponse })}
                    disabled={paused}
                  >
                    <ScheduleIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
      </Grid>

      <ChangeFrequencyDialog
        open={!!selectedJob}
        jobName={selectedJob?.name || ''}
        currentCron={selectedJob ? jobs?.[selectedJob.key]?.cronExpression || '0 0 * * *' : '0 0 * * *'}
        onClose={() => setSelectedJob(null)}
        onSave={handleChangeFrequency}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
