import React, { useEffect, useState } from 'react';

import {
  AccountCircle as AccountIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Groups as GroupsIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchAccounts,
  selectAccountsError,
  selectAccountsLoading,
  selectAllAccounts,
} from '../app/slices/accountsSlice';
import { CombinedAccount } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface EmailSendResponse {
  success: boolean;
  message: string;
  emailsSent?: number;
}

export default function WeeklyEmailManagement() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectAllAccounts);
  const loadingAccounts = useAppSelector(selectAccountsLoading);
  const accountsError = useAppSelector(selectAccountsError);

  const [selectedAccount, setSelectedAccount] = useState<CombinedAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchAccounts(false));
  }, [dispatch]);

  useEffect(() => {
    if (accountsError) {
      setMessage({
        text: accountsError.message || 'Failed to load accounts. Please refresh the page.',
        severity: 'error',
      });
      setShowMessage(true);
    }
  }, [accountsError]);

  const handleRefreshAccounts = () => {
    dispatch(fetchAccounts(true));
  };

  const handlePreviewEmail = async () => {
    if (!selectedAccount) {
      setMessage({
        text: 'Please select an account to preview the email.',
        severity: 'error',
      });
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/v1/admin/email/digest/preview-account', {
        email: selectedAccount.email,
      });

      // Response is pure HTML string
      const htmlContent = response.data;
      setPreviewData(htmlContent);
      setPreviewOpen(true);

      // Check if the HTML content indicates no content available
      if (!htmlContent || htmlContent.trim() === '' || htmlContent.includes('No content available')) {
        setMessage({
          text: 'No content available for weekly email for this account.',
          severity: 'info',
        });
        setShowMessage(true);
      }
    } catch (error: any) {
      console.error('Error previewing email:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to preview email. Please try again.',
        severity: 'error',
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDigestEmail = async () => {
    if (!selectedAccount) {
      setMessage({
        text: 'Please select an account to send the digest email.',
        severity: 'error',
      });
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<EmailSendResponse>('/api/v1/admin/email/digest/send-account', {
        accountId: selectedAccount.id,
        email: selectedAccount.email,
      });

      setMessage({
        text: response.data.message || 'Digest email sent successfully!',
        severity: 'success',
      });
      setShowMessage(true);
    } catch (error: any) {
      console.error('Error sending digest email:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to send digest email. Please try again.',
        severity: 'error',
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDiscoveryEmail = async () => {
    if (!selectedAccount) {
      setMessage({
        text: 'Please select an account to send the discovery email.',
        severity: 'error',
      });
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<EmailSendResponse>('/api/v1/admin/email/discover/send-account', {
        accountId: selectedAccount.id,
        email: selectedAccount.email,
      });

      setMessage({
        text: response.data.message || 'Discovery email sent successfully!',
        severity: 'success',
      });
      setShowMessage(true);
    } catch (error: any) {
      console.error('Error sending discovery email:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to send discovery email. Please try again.',
        severity: 'error',
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWeeklyEmail = async () => {
    if (!selectedAccount) {
      setMessage({
        text: 'Please select an account to send the weekly email.',
        severity: 'error',
      });
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<EmailSendResponse>('/api/v1/admin/email/weekly/send-account', {
        accountId: selectedAccount.id,
        email: selectedAccount.email,
      });

      setMessage({
        text: response.data.message || 'Weekly email sent successfully!',
        severity: 'success',
      });
      setShowMessage(true);
    } catch (error: any) {
      console.error('Error sending weekly email:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to send weekly email. Please try again.',
        severity: 'error',
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWeeklyEmailToAll = async () => {
    if (
      !window.confirm('Are you sure you want to send the weekly email to all accounts? This action cannot be undone.')
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<EmailSendResponse>('/api/v1/admin/email/weekly/send-all');

      setMessage({
        text:
          response.data.message || `Weekly emails sent successfully to ${response.data.emailsSent || 'all'} accounts!`,
        severity: response.data.success ? 'success' : 'error',
      });
      setShowMessage(true);
    } catch (error: any) {
      console.error('Error sending weekly emails to all:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to send weekly emails to all accounts. Please try again.',
        severity: 'error',
      });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  const getSelectedAccountName = () => {
    return selectedAccount ? `${selectedAccount.name} (${selectedAccount.email})` : '';
  };

  if (loadingAccounts) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading accounts...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 4 }}>
        Email Management
      </Typography>

      <Grid container spacing={3}>
        {/* Account Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Selection
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Select Account</InputLabel>
                <Select
                  value={selectedAccount?.id || ''}
                  onChange={(e) => {
                    const accountId = e.target.value;
                    const account = accounts.find((acc) => acc.id === accountId) || null;
                    setSelectedAccount(account);
                  }}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Choose an account</em>
                  </MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshAccounts}
                disabled={loading || loadingAccounts}
              >
                Refresh Accounts
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Individual Account Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Single Account Actions</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Send emails to the selected account: {getSelectedAccountName()}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={20} /> : <PreviewIcon />}
                  onClick={handlePreviewEmail}
                  disabled={!selectedAccount || loading}
                  fullWidth
                >
                  Preview Weekly Email
                </Button>

                <Divider />

                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleSendDigestEmail}
                  disabled={!selectedAccount || loading}
                  fullWidth
                  sx={{ bgcolor: 'primary.main' }}
                >
                  Send Digest Email
                </Button>

                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleSendDiscoveryEmail}
                  disabled={!selectedAccount || loading}
                  fullWidth
                  sx={{ bgcolor: 'info.main' }}
                >
                  Send Discovery Email
                </Button>

                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleSendWeeklyEmail}
                  disabled={!selectedAccount || loading}
                  fullWidth
                  sx={{ bgcolor: 'secondary.main' }}
                >
                  Send Weekly Email (Auto-detect)
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bulk Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <GroupsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Bulk Actions</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Send emails to all accounts in the system
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> This will send weekly emails to all accounts. The system will automatically
                  determine whether to send digest or discovery emails based on available content.
                </Typography>
              </Alert>

              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
                onClick={handleSendWeeklyEmailToAll}
                disabled={loading}
                fullWidth
                size="large"
                color="warning"
              >
                Send Weekly Email to All Accounts
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Email Types Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Email Types Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'success.main', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="success.main" gutterBottom>
                    Digest Email
                  </Typography>
                  <Typography variant="body2">
                    Sent when an account has upcoming episodes or movies or shows to keep watching
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'info.main', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="info.main" gutterBottom>
                    Discovery Email
                  </Typography>
                  <Typography variant="body2">
                    Sent when an account has no favorited content but content recommendations are available
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'secondary.main', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="secondary.main" gutterBottom>
                    Weekly Email (Auto-detect)
                  </Typography>
                  <Typography variant="body2">
                    Automatically determines whether to send digest or discovery email based on available content
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Email Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Email Preview</Typography>
            <IconButton onClick={handleClosePreview} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {previewData && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Email Preview for {selectedAccount?.name}:
              </Typography>

              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.paper',
                  maxHeight: '600px',
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: previewData }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
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
