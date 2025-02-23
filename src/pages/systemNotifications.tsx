import { useEffect, useState } from 'react';

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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

export default function SystemNotifications() {
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
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
      console.log(response.data.reesults);
      setSystemNotifications(response.data.results);
    } catch (error) {
      console.error('Error fetching system notifications:', error);
    }
  };

  useEffect(() => {
    fetchSystemNotifications();
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
        sendToAll: true,
        accountId: null,
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
                  <TableCell>{`All`}</TableCell>
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
