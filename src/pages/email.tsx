import { useCallback, useEffect, useState } from 'react';

import {
  Delete as DeleteIcon,
  Drafts as DraftsIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchAccounts,
  selectAccountsError,
  selectAccountsLoading,
  selectAllAccounts,
} from '../app/slices/accountsSlice';
import { PaginationInfo } from '../types/contentTypes';
import { CombinedAccount } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface EmailFormData {
  subject: string;
  message: string;
  sendToAll: boolean;
  selectedAccounts: CombinedAccount[];
  scheduleDate: Date | null;
  isScheduled: boolean;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface SentEmail {
  id: number;
  subject: string;
  message: string;
  sentToAll: boolean;
  accountCount: number;
  scheduledDate: string | null;
  sentDate: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface EmailApiResponse {
  message: string;
  pagination: PaginationInfo;
  results: SentEmail[];
}

export default function EmailManagement() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectAllAccounts);
  const loadingAccounts = useAppSelector(selectAccountsLoading);
  const accountsError = useAppSelector(selectAccountsError);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(25);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(
    null,
  );
  const [showMessage, setShowMessage] = useState<boolean>(false);

  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    message: '',
    sendToAll: true,
    selectedAccounts: [],
    scheduleDate: null,
    isScheduled: false,
  });

  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    subject: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState<{
    subject?: string;
    message?: string;
    scheduleDate?: string;
    recipients?: string;
  }>({});
  const [templateErrors, setTemplateErrors] = useState<{
    name?: string;
    subject?: string;
    message?: string;
  }>({});
  const [loading, setLoading] = useState(false);

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

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/admin/email/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setMessage({ text: 'Failed to fetch email templates', severity: 'error' });
      setShowMessage(true);
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    try {
      const response = await axios.get<EmailApiResponse>(
        `/api/v1/admin/email/emails?page=${page}&limit=${rowsPerPage}`,
      );
      setSentEmails(response.data.results || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching sent emails:', error);
      setMessage({ text: 'Failed to fetch sent emails', severity: 'error' });
      setShowMessage(true);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchTemplates();
    fetchEmails();
  }, [fetchTemplates, fetchEmails]);

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  const validateEmailForm = (): boolean => {
    const errors: {
      subject?: string;
      message?: string;
      scheduleDate?: string;
      recipients?: string;
    } = {};

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }

    if (!formData.sendToAll && formData.selectedAccounts.length === 0) {
      errors.recipients = 'Please select at least one account or choose "Send to All"';
    }

    if (formData.isScheduled && !formData.scheduleDate) {
      errors.scheduleDate = 'Schedule date is required when scheduling email';
    }

    if (formData.isScheduled && formData.scheduleDate && formData.scheduleDate <= new Date()) {
      errors.scheduleDate = 'Schedule date must be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTemplateForm = (): boolean => {
    const errors: {
      name?: string;
      subject?: string;
      message?: string;
    } = {};

    if (!templateFormData.name.trim()) {
      errors.name = 'Template name is required';
    }

    if (!templateFormData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!templateFormData.message.trim()) {
      errors.message = 'Message is required';
    }

    setTemplateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendEmail = async (isDraft: boolean = false) => {
    if (!validateEmailForm()) return;

    setLoading(true);
    try {
      const emailData = {
        subject: formData.subject,
        message: formData.message,
        sendToAll: formData.sendToAll,
        recipients: formData.sendToAll
          ? []
          : formData.selectedAccounts.map((acc) => ({
              accountId: acc.id,
              email: acc.email,
              name: acc.name,
              emailVerified: acc.emailVerified,
            })),
        scheduleDate: formData.isScheduled ? formData.scheduleDate?.toISOString() : null,
        isDraft,
      };

      await axios.post('/api/v1/email/emails', emailData);

      const action = isDraft ? 'saved as draft' : formData.isScheduled ? 'scheduled' : 'sent';
      setMessage({ text: `Email ${action} successfully!`, severity: 'success' });

      handleCloseEmailDialog();
      fetchEmails();
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({ text: 'Failed to send email. Please try again.', severity: 'error' });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!validateTemplateForm()) return;

    setLoading(true);
    try {
      if (editingTemplate) {
        const response = await axios.put(`/api/v1/admin/email/templates/${editingTemplate.id}`, templateFormData);
        setMessage({ text: 'Template updated successfully!', severity: 'success' });
        setShowMessage(true);
        setTemplates(response.data.templates || []);
      } else {
        const response = await axios.post('/api/v1/admin/email/templates', templateFormData);
        setMessage({ text: 'Template created successfully!', severity: 'success' });
        setShowMessage(true);
        setTemplates(response.data.templates || []);
      }

      handleCloseTemplateDialog();
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ text: 'Failed to save template. Please try again.', severity: 'error' });
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await axios.delete(`/api/v1/admin/email/templates/${templateId}`);
      setMessage({ text: 'Template deleted successfully!', severity: 'success' });
      setShowMessage(true);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage({ text: 'Failed to delete template. Please try again.', severity: 'error' });
      setShowMessage(true);
    }
  };

  const handleDeleteEmail = async (emailId: number) => {
    if (!window.confirm('Are you sure you want to delete this email?')) return;

    try {
      await axios.delete(`/api/v1/email/emails/${emailId}`);
      setMessage({ text: 'Email deleted successfully!', severity: 'success' });
      setShowMessage(true);
      fetchEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
      setMessage({ text: 'Failed to delete email. Please try again.', severity: 'error' });
      setShowMessage(true);
    }
  };

  const handleOpenEmailDialog = (template?: EmailTemplate) => {
    setFormData({
      subject: template?.subject || '',
      message: template?.message || '',
      sendToAll: true,
      selectedAccounts: [],
      scheduleDate: null,
      isScheduled: false,
    });
    setFormErrors({});
    setOpenEmailDialog(true);

    if (template) {
      setMessage({ text: 'Template loaded successfully!', severity: 'info' });
      setShowMessage(true);
    }
  };

  const handleCloseEmailDialog = () => {
    setOpenEmailDialog(false);
    setFormData({
      subject: '',
      message: '',
      sendToAll: true,
      selectedAccounts: [],
      scheduleDate: null,
      isScheduled: false,
    });
    setFormErrors({});
  };

  const handleOpenTemplateDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateFormData({
        name: template.name,
        subject: template.subject,
        message: template.message,
      });
    } else {
      setEditingTemplate(null);
      setTemplateFormData({
        name: '',
        subject: '',
        message: '',
      });
    }
    setTemplateErrors({});
    setOpenTemplateDialog(true);
  };

  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      subject: '',
      message: '',
    });
    setTemplateErrors({});
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    // Open dialog with template data pre-filled
    handleOpenEmailDialog(template);
  };

  const handleAccountSelection = (account: CombinedAccount, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedAccounts: checked
        ? [...prev.selectedAccounts, account]
        : prev.selectedAccounts.filter((acc) => acc.id !== account.id),
    }));
  };

  const handleSelectAllAccounts = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedAccounts: checked ? [...accounts] : [],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'draft':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Email Management</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DraftsIcon />} onClick={() => handleOpenTemplateDialog()}>
            Create Template
          </Button>
          <Button variant="contained" startIcon={<EmailIcon />} onClick={() => handleOpenEmailDialog()}>
            Compose Email
          </Button>
        </Stack>
      </Stack>

      {/* Email Templates Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Email Templates
        </Typography>
        {templates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No templates created yet. Create your first template to get started.
          </Typography>
        ) : (
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {templates.map((template) => (
              <Paper key={template.id} variant="outlined" sx={{ p: 2, minWidth: 250, maxWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Subject: {template.subject}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => handleUseTemplate(template)}>
                    Use
                  </Button>
                  <IconButton size="small" onClick={() => handleOpenTemplateDialog(template)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Sent Emails Section */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Sent, Scheduled & Draft Emails</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Recipients</TableCell>
                <TableCell>Scheduled/Sent Date</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sentEmails.map((email) => (
                <TableRow key={email.id} hover>
                  <TableCell>
                    <Chip label={email.status.toUpperCase()} color={getStatusColor(email.status)} size="small" />
                  </TableCell>
                  <TableCell>{email.subject}</TableCell>
                  <TableCell>{email.sentToAll ? 'All Accounts' : `${email.accountCount} accounts`}</TableCell>
                  <TableCell>
                    {email.sentDate
                      ? formatDate(email.sentDate)
                      : email.scheduledDate
                        ? formatDate(email.scheduledDate)
                        : 'Not scheduled'}
                  </TableCell>
                  <TableCell>{formatDate(email.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleDeleteEmail(email.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination && (
          <TablePagination
            rowsPerPageOptions={[rowsPerPage]}
            component="div"
            count={pagination.totalCount}
            rowsPerPage={rowsPerPage}
            page={pagination.currentPage - 1}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
          />
        )}
      </Paper>

      {/* Compose Email Dialog */}
      <Dialog open={openEmailDialog} onClose={handleCloseEmailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Compose Email</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Template Selector */}
            <FormControl fullWidth>
              <Select
                value=""
                onChange={(e) => {
                  const templateId = e.target.value as unknown as number;
                  const template = templates.find((t) => t.id === templateId);
                  if (template) {
                    setFormData((prev) => ({
                      ...prev,
                      subject: template.subject,
                      message: template.message,
                    }));
                    setMessage({ text: 'Template loaded!', severity: 'info' });
                  }
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Choose a template...</em>
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              error={!!formErrors.subject}
              helperText={formErrors.subject}
            />

            <TextField
              label="Message"
              fullWidth
              multiline
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              error={!!formErrors.message}
              helperText={formErrors.message}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.sendToAll}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sendToAll: e.target.checked,
                      selectedAccounts: e.target.checked ? [] : prev.selectedAccounts,
                    }))
                  }
                />
              }
              label="Send to All Accounts"
            />

            {!formData.sendToAll && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Select Recipients ({formData.selectedAccounts.length} of {accounts.length} selected)
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.selectedAccounts.length === accounts.length}
                      indeterminate={
                        formData.selectedAccounts.length > 0 && formData.selectedAccounts.length < accounts.length
                      }
                      onChange={(e) => handleSelectAllAccounts(e.target.checked)}
                    />
                  }
                  label={`Select All (${accounts.length} accounts)`}
                  sx={{ mb: 1 }}
                />

                <Box
                  sx={{
                    maxHeight: 200,
                    overflow: 'auto',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  {accounts.map((account) => (
                    <Box
                      key={account.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        width: '100%',
                        px: 1.5,
                        py: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      <Checkbox
                        checked={formData.selectedAccounts.some((acc) => acc.id === account.id)}
                        onChange={(e) => handleAccountSelection(account, e.target.checked)}
                        sx={{ p: 0, mr: 1.5, mt: 0.25 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {account.name}
                          </Typography>
                          {!account.emailVerified && (
                            <Chip
                              label="Unverified"
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {account.email}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {formErrors.recipients && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {formErrors.recipients}
                  </Typography>
                )}
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isScheduled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isScheduled: e.target.checked,
                      scheduleDate: e.target.checked ? prev.scheduleDate : null,
                    }))
                  }
                />
              }
              label="Schedule Email"
            />

            {formData.isScheduled && (
              <DateTimePicker
                label="Schedule Date"
                value={formData.scheduleDate}
                onChange={(date) => setFormData((prev) => ({ ...prev, scheduleDate: date }))}
                slotProps={{
                  textField: {
                    error: !!formErrors.scheduleDate,
                    helperText: formErrors.scheduleDate,
                  },
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailDialog}>Cancel</Button>
          <Button onClick={() => handleSendEmail(true)} disabled={loading} startIcon={<DraftsIcon />}>
            Save Draft
          </Button>
          <Button
            onClick={() => handleSendEmail(false)}
            variant="contained"
            disabled={loading}
            startIcon={<SendIcon />}
          >
            {formData.isScheduled ? 'Schedule' : 'Send'} Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={openTemplateDialog} onClose={handleCloseTemplateDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Template Name"
              fullWidth
              value={templateFormData.name}
              onChange={(e) => setTemplateFormData((prev) => ({ ...prev, name: e.target.value }))}
              error={!!templateErrors.name}
              helperText={templateErrors.name}
            />

            <TextField
              label="Subject"
              fullWidth
              value={templateFormData.subject}
              onChange={(e) => setTemplateFormData((prev) => ({ ...prev, subject: e.target.value }))}
              error={!!templateErrors.subject}
              helperText={templateErrors.subject}
            />

            <TextField
              label="Message"
              fullWidth
              multiline
              rows={6}
              value={templateFormData.message}
              onChange={(e) => setTemplateFormData((prev) => ({ ...prev, message: e.target.value }))}
              error={!!templateErrors.message}
              helperText={templateErrors.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained" disabled={loading}>
            {editingTemplate ? 'Update' : 'Create'} Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
