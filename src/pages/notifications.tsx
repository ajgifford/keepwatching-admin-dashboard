import { useEffect, useState } from 'react';

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

import { AdminNotification, CombinedAccount, NotificationType } from '@ajgifford/keepwatching-types';
import axios from 'axios';

interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType | null;
  startDate: Date | null;
  endDate: Date | null;
  sendToAll: boolean;
  accountId: number | null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [accounts, setAccounts] = useState<CombinedAccount[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [expired, setExpired] = useState<boolean>(true);
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: null,
    startDate: null,
    endDate: null,
    sendToAll: true,
    accountId: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<NotificationFormData>>({});

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`/api/v1/notifications?expired=${expired}`);
      setNotifications(response.data.results);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('api/v1/accounts');
      setAccounts(response.data.results);
    } catch (error) {
      console.error('Error fetching accounts', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [expired]);

  const validateForm = (): boolean => {
    const errors: Partial<NotificationFormData> = {};
    if (!formData.title.trim()) {
      errors.message = 'Title is required';
    }
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    if (!formData.type) {
      errors.message = 'Type is required';
    }
    if (!formData.startDate) {
      errors.message = 'Start date is required';
    }
    if (!formData.endDate) {
      errors.message = 'End date is required';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.message = 'End date must be after start date';
    }
    if (formData.sendToAll && formData.accountId) {
      errors.message = 'Both Send to All and an account id cannot be set';
    }
    if (!formData.sendToAll && !formData.accountId) {
      errors.message = 'Either Send to All or an account id must be set';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingNotification) {
        await axios.put(`/api/v1/notifications/${editingNotification.id}`, formData);
      } else {
        await axios.post('/api/v1/notifications', formData);
      }
      await fetchNotifications();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;

    try {
      await axios.delete(`/api/v1/notifications/${id}`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleOpenDialog = (notification?: AdminNotification) => {
    if (notification) {
      setEditingNotification(notification);
      setFormData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        startDate: new Date(notification.startDate),
        endDate: new Date(notification.endDate),
        sendToAll: notification.sendToAll,
        accountId: notification.accountId,
      });
    } else {
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        type: null,
        startDate: null,
        endDate: null,
        sendToAll: true,
        accountId: null,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      type: null,
      startDate: null,
      endDate: null,
      sendToAll: true,
      accountId: null,
    });
  };

  const getNotificationStatus = (notification: AdminNotification): 'active' | 'inactive' | 'scheduled' => {
    const now = new Date();
    const startDate = new Date(notification.startDate);
    const endDate = new Date(notification.endDate);

    if (now < startDate) return 'scheduled';
    if (now > endDate) return 'inactive';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const notificationTypeConfig: Record<NotificationType, { label: string; description?: string }> = {
    general: { label: 'General', description: 'General announcements' },
    feature: { label: 'Feature', description: 'New features and updates' },
    issue: { label: 'Issue', description: 'Problems or bugs to report' },
    movie: { label: 'Movie', description: 'Films and cinema content' },
    tv: { label: 'TV Show', description: 'Television series and episodes' },
  };

  // Get all notification types as an array
  const notificationTypes: NotificationType[] = Object.keys(notificationTypeConfig) as NotificationType[];

  const buildAccountColumn = (notification: AdminNotification) => {
    if (notification.sendToAll) {
      return 'All';
    }
    return accounts.find((a) => a.id === notification.accountId)?.name || 'Invalid';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Notifications</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={<Checkbox checked={expired} onChange={(e) => setExpired(e.target.checked)} />}
            label="Show Expired"
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Create Notification
          </Button>
        </Box>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Send to All/Account</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => {
              const status = getNotificationStatus(notification);
              return (
                <TableRow key={notification.id}>
                  <TableCell>
                    <Chip label={status} color={getStatusColor(status)} size="small" />
                  </TableCell>
                  <TableCell>{notification.type}</TableCell>
                  <TableCell>{notification.title}</TableCell>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>{new Date(notification.startDate).toLocaleString()}</TableCell>
                  <TableCell>{new Date(notification.endDate).toLocaleString()}</TableCell>
                  <TableCell>{buildAccountColumn(notification)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(notification)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(notification.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as NotificationType }))}
              >
                {notificationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {notificationTypeConfig[type].label}
                    {notificationTypeConfig[type].description && ` (${notificationTypeConfig[type].description})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              error={!!formErrors.message}
              helperText={formErrors.message}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              error={!!formErrors.message}
              helperText={formErrors.message}
            />
            <DateTimePicker
              label="Start Date"
              value={formData.startDate}
              onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
              slotProps={{
                textField: {
                  error: !!formErrors.startDate,
                  helperText: formErrors.message,
                },
              }}
            />
            <DateTimePicker
              label="End Date"
              value={formData.endDate}
              onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
              slotProps={{
                textField: {
                  error: !!formErrors.endDate,
                  helperText: formErrors.message,
                },
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sendToAll}
                    disabled={editingNotification !== null}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sendToAll: e.target.checked,
                        accountId: e.target.checked ? null : prev.accountId,
                      }))
                    }
                  />
                }
                label="Send to All"
              />
              <FormControl fullWidth disabled={formData.sendToAll || editingNotification !== null}>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.accountId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: Number(e.target.value) }))}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNotification ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
