import { useEffect, useState } from 'react';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
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
  Radio,
  RadioGroup,
  Select,
  Snackbar,
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

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchAccounts,
  selectAccountsError,
  selectAccountsLoading,
  selectAllAccounts,
} from '../app/slices/accountsSlice';
import { AdminNotification, NotificationType } from '@ajgifford/keepwatching-types';
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

type NotificationSortField = 'startDate' | 'endDate' | 'type' | 'sendToAll';
type SortOrder = 'asc' | 'desc';

export default function Notifications() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectAllAccounts);
  const loadingAccounts = useAppSelector(selectAccountsLoading);
  const accountsError = useAppSelector(selectAccountsError);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [expired, setExpired] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterSendToAll, setFilterSendToAll] = useState<'all' | 'true' | 'false'>('all');

  // Sort states
  const [sortBy, setSortBy] = useState<NotificationSortField>('startDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      params.append('expired', expired.toString());

      if (filterType) {
        params.append('type', filterType);
      }
      if (filterStartDate) {
        params.append('startDate', filterStartDate.toISOString());
      }
      if (filterEndDate) {
        params.append('endDate', filterEndDate.toISOString());
      }
      if (filterSendToAll !== 'all') {
        params.append('sendToAll', filterSendToAll);
      }
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await axios.get(`/api/v1/notifications?${params.toString()}`);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [expired, filterType, filterStartDate, filterEndDate, filterSendToAll, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setFilterType('');
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterSendToAll('all');
    setSortBy('startDate');
    setSortOrder('desc');
  };

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

  const handleCloseMessage = () => {
    setShowMessage(false);
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
        <Typography variant="h5">Notifications</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Create Notification
          </Button>
        </Box>
      </Stack>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters & Sorting
          </Typography>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={expired} onChange={(e) => setExpired(e.target.checked)} />}
              label="Show Expired"
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as NotificationType | '')}>
                <MenuItem value="">All Types</MenuItem>
                {notificationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {notificationTypeConfig[type].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DateTimePicker
              label="Filter Start Date"
              value={filterStartDate}
              onChange={(date) => setFilterStartDate(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />

            <DateTimePicker
              label="Filter End Date"
              value={filterEndDate}
              onChange={(date) => setFilterEndDate(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as NotificationSortField)}>
                <MenuItem value="startDate">Start Date</MenuItem>
                <MenuItem value="endDate">End Date</MenuItem>
                <MenuItem value="type">Type</MenuItem>
                <MenuItem value="sendToAll">Send To All</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sort Order</InputLabel>
              <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Target Audience
            </Typography>
            <RadioGroup
              row
              value={filterSendToAll}
              onChange={(e) => setFilterSendToAll(e.target.value as 'all' | 'true' | 'false')}
            >
              <FormControlLabel value="all" control={<Radio />} label="All" />
              <FormControlLabel value="true" control={<Radio />} label="System-wide Only" />
              <FormControlLabel value="false" control={<Radio />} label="Account-specific Only" />
            </RadioGroup>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </Box>
        </Paper>
      </Collapse>

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
