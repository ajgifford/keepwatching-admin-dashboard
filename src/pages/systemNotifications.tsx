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

import { SystemNotification } from '../types/types';
import axios from 'axios';

interface NotificationFormData {
  message: string;
  startDate: Date | null;
  endDate: Date | null;
  sendToAll: boolean;
  accountId: number | null;
}

interface Account {
  account_id: number;
  account_name: string;
}

export default function SystemNotifications() {
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [expired, setExpired] = useState<boolean>(true);
  const [editingSystemNotification, setEditingSystemNotification] = useState<SystemNotification | null>(null);
  const [formData, setFormData] = useState<NotificationFormData>({
    message: '',
    startDate: null,
    endDate: null,
    sendToAll: true,
    accountId: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<NotificationFormData>>({});

  const fetchSystemNotifications = async () => {
    try {
      const response = await axios.get(`/api/v1/systemNotifications?expired=${expired}`);
      console.log(response.data.results);
      setSystemNotifications(response.data.results);
    } catch (error) {
      console.error('Error fetching system notifications:', error);
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
    fetchSystemNotifications();
    fetchAccounts();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<NotificationFormData> = {};
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
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
      if (editingSystemNotification) {
        await axios.put(`/api/v1/systemNotifications/${editingSystemNotification.id}`, formData);
      } else {
        await axios.post('/api/v1/systemNotifications', formData);
      }
      await fetchSystemNotifications();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;

    try {
      await axios.delete(`/api/v1/systemNotifications/${id}`);
      await fetchSystemNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleOpenDialog = (notification?: SystemNotification) => {
    if (notification) {
      setEditingSystemNotification(notification);
      setFormData({
        message: notification.message,
        startDate: new Date(notification.start_date),
        endDate: new Date(notification.end_date),
        sendToAll: notification.send_to_all,
        accountId: notification.account_id,
      });
    } else {
      setEditingSystemNotification(null);
      setFormData({
        message: '',
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
    setEditingSystemNotification(null);
    setFormData({
      message: '',
      startDate: null,
      endDate: null,
      sendToAll: true,
      accountId: null,
    });
  };

  const getSystemNotificationStatus = (notification: SystemNotification): 'active' | 'inactive' | 'scheduled' => {
    const now = new Date();
    const startDate = new Date(notification.start_date);
    const endDate = new Date(notification.end_date);

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

  const buildAccountColumn = (notification: SystemNotification) => {
    if (notification.send_to_all) {
      return 'All';
    }
    accounts.find((a) => a.account_id === notification.account_id)?.account_name;
    return accounts.find((a) => a.account_id === notification.account_id)?.account_name || 'Invalid';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">System Notifications</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Create Notification
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Send to All/Account</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {systemNotifications.map((notification) => {
              const status = getSystemNotificationStatus(notification);
              return (
                <TableRow key={notification.id}>
                  <TableCell>
                    <Chip label={status} color={getStatusColor(status)} size="small" />
                  </TableCell>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>{new Date(notification.start_date).toLocaleString()}</TableCell>
                  <TableCell>{new Date(notification.end_date).toLocaleString()}</TableCell>
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
        <DialogTitle>{editingSystemNotification ? 'Edit Notification' : 'Create New Notification'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                    disabled={editingSystemNotification !== null}
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
              <FormControl fullWidth disabled={formData.sendToAll || editingSystemNotification !== null}>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.accountId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: Number(e.target.value) }))}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.account_id} value={account.account_id}>
                      {account.account_name}
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
            {editingSystemNotification ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
