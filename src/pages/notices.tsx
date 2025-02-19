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

import { SystemNotice } from '../types/types';
import axios from 'axios';

interface NoticeFormData {
  message: string;
  startDate: Date | null;
  endDate: Date | null;
}

export default function Notices() {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotice, setEditingNotice] = useState<SystemNotice | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>({
    message: '',
    startDate: null,
    endDate: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<NoticeFormData>>({});

  const fetchNotices = async () => {
    try {
      const response = await axios.get('/api/notices');
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<NoticeFormData> = {};
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
      if (editingNotice) {
        await axios.put(`/api/notices/${editingNotice.id}`, formData);
      } else {
        await axios.post('/api/notices', formData);
      }
      await fetchNotices();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving notice:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      await axios.delete(`/api/notices/${id}`);
      await fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const handleOpenDialog = (notice?: SystemNotice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        message: notice.message,
        startDate: new Date(notice.startDate),
        endDate: new Date(notice.endDate),
      });
    } else {
      setEditingNotice(null);
      setFormData({
        message: '',
        startDate: null,
        endDate: null,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotice(null);
    setFormData({
      message: '',
      startDate: null,
      endDate: null,
    });
  };

  const getNoticeStatus = (notice: SystemNotice): 'active' | 'inactive' | 'scheduled' => {
    const now = new Date();
    const startDate = new Date(notice.startDate);
    const endDate = new Date(notice.endDate);

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
        <Typography variant="h5">System Notices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Create Notice
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((notice) => {
              const status = getNoticeStatus(notice);
              return (
                <TableRow key={notice.id}>
                  <TableCell>
                    <Chip label={status} color={getStatusColor(status)} size="small" />
                  </TableCell>
                  <TableCell>{notice.message}</TableCell>
                  <TableCell>{new Date(notice.startDate).toLocaleString()}</TableCell>
                  <TableCell>{new Date(notice.endDate).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(notice)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(notice.id)}>
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
        <DialogTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</DialogTitle>
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
            {editingNotice ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
