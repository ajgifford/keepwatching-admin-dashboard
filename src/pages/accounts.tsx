import React, { useCallback, useEffect, useState } from 'react';

import {
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Movie as MovieIcon,
  Refresh as RefreshIcon,
  Tv as TvIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  deleteAccount,
  deleteProfile,
  editAccount,
  fetchAccounts,
  fetchProfilesForAccount,
  selectAccountsError,
  selectAccountsLoading,
  selectAllAccounts,
  selectProfilesForAccount,
  updateProfileName,
} from '../app/slices/accountsSlice';
import { AdminProfile, CombinedAccount } from '@ajgifford/keepwatching-types';
import { da } from 'date-fns/locale';
import { normalize } from 'path';

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

interface ProfileListProps {
  accountId: number;
  account: CombinedAccount;
  setEditingProfile: (profile: AdminProfile) => void;
  setNewName: (name: string) => void;
  setProfileToDelete: (data: { accountId: number; profileId: number }) => void;
}

const ProfileList: React.FC<ProfileListProps> = ({
  accountId,
  account,
  setEditingProfile,
  setNewName,
  setProfileToDelete,
}) => {
  const profiles = useAppSelector((state) => selectProfilesForAccount(state, accountId));

  return (
    <List>
      {profiles?.map((profile) => (
        <React.Fragment key={profile.id}>
          <Box
            component="li"
            sx={{
              py: 2,
              px: 1,
              position: 'relative',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Box display="flex" alignItems="flex-start" width="100%">
              <Avatar src={profile.image} sx={{ mr: 2 }}>
                {profile.name[0]}
              </Avatar>
              <Box flexGrow={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" sx={{ mr: 1 }}>
                    {profile.name}
                  </Typography>
                  {account.defaultProfileId === profile.id && (
                    <Chip size="small" label="Default" color="primary" sx={{ mr: 1 }} />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Created: {new Date(profile.createdAt).toLocaleDateString()}
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box display="flex" alignItems="center" mr={4}>
                    <MovieIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">{profile.favoritedMovies || 0} Favorite Movies</Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <TvIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">{profile.favoritedShows || 0} Favorite Shows</Typography>
                  </Box>
                </Box>
              </Box>
              <Box>
                <IconButton
                  onClick={() => {
                    setEditingProfile(profile);
                    setNewName(profile.name);
                  }}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setProfileToDelete({ accountId: account.id, profileId: profile.id });
                  }}
                  size="small"
                  disabled={account.defaultProfileId === profile.id}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );
};

function Accounts() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectAllAccounts);
  const loadingAccounts = useAppSelector(selectAccountsLoading);
  const accountsError = useAppSelector(selectAccountsError);

  const [expandedAccount, setExpandedAccount] = useState<number | false>(false);
  const [editingAccount, setEditingAccount] = useState<CombinedAccount | null>(null);
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accountIdToDelete, setAccountIdToDelete] = useState<number | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<{ accountId: number; profileId: number } | null>(null);

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

  const loadProfilesForAccount = useCallback(
    async (accountId: number) => {
      dispatch(fetchProfilesForAccount(accountId));
    },
    [dispatch],
  );

  const handleAccountExpand = useCallback(
    async (accountId: number) => {
      if (expandedAccount === accountId) {
        setExpandedAccount(false);
        return;
      }

      setExpandedAccount(accountId);
      await loadProfilesForAccount(accountId);
    },
    [expandedAccount, loadProfilesForAccount],
  );

  const handleAccountNameUpdate = useCallback(async () => {
    if (!editingAccount) return;
    dispatch(
      editAccount({ accountId: editingAccount.id, defaultProfileId: editingAccount.defaultProfileId!, name: newName }),
    );
    setEditingAccount(null);
    setNewName('');
  }, [dispatch, editingAccount, newName]);

  const handleProfileNameUpdate = useCallback(async () => {
    if (!editingProfile) return;
    dispatch(
      updateProfileName({
        accountId: editingProfile.accountId,
        profileId: editingProfile.id,
        name: newName,
      }),
    );
    setEditingProfile(null);
    setNewName('');
  }, [dispatch, editingProfile, newName]);

  const handleDeleteAccount = useCallback(async () => {
    if (!accountIdToDelete) return;
    dispatch(deleteAccount(accountIdToDelete));
    setAccountIdToDelete(null);
  }, [dispatch, accountIdToDelete]);

  const handleDeleteProfile = useCallback(async () => {
    if (!profileToDelete) return;
    const { accountId, profileId } = profileToDelete;

    const account = accounts.find((a) => a.id === accountId);
    if (account?.defaultProfileId === profileId) {
      setMessage({ text: 'Cannot delete default profile', severity: 'error' });
      setShowMessage(true);
      setProfileToDelete(null);
      return;
    }

    dispatch(deleteProfile({ accountId, profileId }));
    setProfileToDelete(null);
  }, [dispatch, profileToDelete, accounts]);

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

      {accounts.map((account) => (
        <Box key={account.id} sx={{ position: 'relative', mb: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Accordion expanded={expandedAccount === account.id} onChange={() => handleAccountExpand(account.id)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Avatar src={account.image!} sx={{ mr: 2 }}>
                    {account.name}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6">{account.name}</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        {account.emailVerified ? account.email : `${account.email} (not verified)`}
                      </Typography>
                      <Box display="flex" alignItems="center" ml={2}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          Created: {formatFirebaseLogin(account.metadata.creationTime)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" ml={2}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          Last login (Firebase): {formatFirebaseLogin(account.metadata.lastSignInTime)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" ml={2}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          Last login: {formatAccountLogin(account.lastLogin, 'No Login')}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" ml={2}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          Last activity: {formatAccountLogin(account.lastActivity, 'No Activity')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <ProfileList
                  accountId={account.id}
                  account={account}
                  setEditingProfile={setEditingProfile}
                  setNewName={setNewName}
                  setProfileToDelete={setProfileToDelete}
                />
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Action buttons outside the Accordion to avoid nesting buttons */}
          <Box sx={{ ml: 2, display: 'flex', flexDirection: 'row', gap: 1 }}>
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
        </Box>
      ))}

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

      {/* Profile Name Edit Dialog */}
      <Dialog open={editingProfile !== null} onClose={() => setEditingProfile(null)}>
        <DialogTitle>Edit Profile Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Profile Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProfile(null)}>Cancel</Button>
          <Button onClick={handleProfileNameUpdate}>Save</Button>
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

      {/* Delete Profile Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={profileToDelete !== null}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onConfirm={handleDeleteProfile}
        onCancel={() => setProfileToDelete(null)}
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
