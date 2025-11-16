import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import RemoveModeratorIcon from '@mui/icons-material/RemoveModerator';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  deleteAccount,
  editAccount,
  fetchAccounts,
  selectAccountsError,
  selectAccountsLoading,
  selectAllAccounts,
  verifyEmail,
} from '../app/slices/accountsSlice';
import { CombinedAccount } from '@ajgifford/keepwatching-types';
import { LoadingComponent } from '@ajgifford/keepwatching-ui';

interface DeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteDialogProps> = ({ open, title, message, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} color="error">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

function Accounts() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const accounts = useAppSelector(selectAllAccounts);
  const loadingAccounts = useAppSelector(selectAccountsLoading);
  const accountsError = useAppSelector(selectAccountsError);

  const [editingAccount, setEditingAccount] = useState<CombinedAccount | null>(null);
  const [newName, setNewName] = useState('');
  const [accountIdToDelete, setAccountIdToDelete] = useState<number | null>(null);

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

  const handleAccountNameUpdate = () => {
    if (!editingAccount) return;
    dispatch(
      editAccount({ accountId: editingAccount.id, defaultProfileId: editingAccount.defaultProfileId!, name: newName }),
    );
    setEditingAccount(null);
    setNewName('');
  };

  const handleDeleteAccount = () => {
    if (!accountIdToDelete) return;
    dispatch(deleteAccount(accountIdToDelete));
    setAccountIdToDelete(null);
  };

  const handleVerifyEmail = (account: CombinedAccount) => {
    if (account && account.uid) {
      dispatch(verifyEmail(account.uid));
    }
  };

  const formatFirebaseLogin = (date: string) => {
    if (date === null) {
      return 'No Login';
    }
    const lastLogin = new Date(date);
    return formatLastDateString(lastLogin);
  };

  const formatAccountLogin = (date: Date | null, noResponse: string) => {
    if (!date) {
      return noResponse;
    }

    const loginDate = new Date(date);
    return formatLastDateString(loginDate);
  };

  const formatLastDateString = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    return date.toLocaleDateString();
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  if (loadingAccounts) {
    return <LoadingComponent message="Loading Accounts..." />;
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ my: 4 }}>
        Account Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">Showing {accounts.length} accounts</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAccounts}
            disabled={loadingAccounts}
          >
            Refresh Accounts
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Account</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Email Verified</TableCell>
              <TableCell align="center">Created</TableCell>
              <TableCell align="center">Last Firebase Login</TableCell>
              <TableCell align="center">Last Login</TableCell>
              <TableCell align="center">Last Activity</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar src={account.image!} sx={{ mr: 2 }}>
                      {account.name}
                    </Avatar>
                    <Typography variant="body1">{account.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{account.email}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {account.emailVerified ? (
                      <VerifiedUserIcon color="success" />
                    ) : (
                      <RemoveModeratorIcon color="error" />
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{formatFirebaseLogin(account.metadata.creationTime)}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{formatFirebaseLogin(account.metadata.lastSignInTime)}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{formatAccountLogin(account.lastLogin, 'No Login')}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{formatAccountLogin(account.lastActivity, 'No Activity')}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Tooltip title="View Account Details" placement="top">
                      <IconButton
                        onClick={() => {
                          navigate(`/accounts/${account.id}`);
                        }}
                        size="small"
                        color="primary"
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Verify Email" placement="top">
                      <IconButton
                        color="secondary"
                        disabled={account.emailVerified}
                        onClick={() => {
                          handleVerifyEmail(account);
                        }}
                        size="small"
                      >
                        <VerifiedUserIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Account Name" placement="top">
                      <IconButton
                        onClick={() => {
                          setEditingAccount(account);
                          setNewName(account.name);
                        }}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Account" placement="top">
                      <IconButton
                        onClick={() => {
                          setAccountIdToDelete(account.id);
                        }}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Account Name Edit Dialog */}
      <Dialog open={editingAccount !== null} onClose={() => setEditingAccount(null)}>
        <DialogTitle>Edit Account Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Account Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAccount(null)}>Cancel</Button>
          <Button onClick={handleAccountNameUpdate}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={accountIdToDelete !== null}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone and will delete all associated profiles."
        onConfirm={handleDeleteAccount}
        onCancel={() => setAccountIdToDelete(null)}
      />

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

export default Accounts;
