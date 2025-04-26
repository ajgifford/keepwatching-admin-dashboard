import React, { useCallback, useEffect, useState } from 'react';

import {
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Movie as MovieIcon,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { Account, Profile } from '../types/types';
import axios from 'axios';

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expandedAccount, setExpandedAccount] = useState<number | false>(false);
  const [profilesByAccount, setProfilesByAccount] = useState<Record<number, Profile[]>>({});
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountIdToDelete, setAccountIdToDelete] = useState<number | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<{ accountId: number; profileId: number } | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/accounts');
      setAccounts(response.data.results);
      setLoading(false);
    } catch (err) {
      setError('Failed to load accounts: ' + err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const loadProfilesForAccount = useCallback(async (accountId: number) => {
    try {
      const response = await axios.get(`/api/v1/accounts/${accountId}/profiles`);
      const profiles: Profile[] = response.data.results;
      setProfilesByAccount((prev) => ({
        ...prev,
        [accountId]: profiles,
      }));
    } catch (err) {
      setError('Failed to load profiles: ' + err);
    }
  }, []);

  const handleAccountExpand = useCallback(
    async (accountId: number) => {
      if (expandedAccount === accountId) {
        setExpandedAccount(false);
        return;
      }

      setExpandedAccount(accountId);
      if (!profilesByAccount[accountId]) {
        await loadProfilesForAccount(accountId);
      }
    },
    [expandedAccount, profilesByAccount, loadProfilesForAccount],
  );

  const handleAccountNameUpdate = useCallback(async () => {
    if (!editingAccount) return;
    try {
      await axios.put(`/api/v1/accounts/${editingAccount.account_id}`, {
        name: newName,
        defaultProfileId: editingAccount.default_profile_id,
      });
      setAccounts((prev) =>
        prev.map((a) => (a.account_id === editingAccount.account_id ? { ...a, account_name: newName } : a)),
      );
      setEditingAccount(null);
      setNewName('');
    } catch (err) {
      setError('Failed to update account name: ' + err);
    }
  }, [editingAccount, newName]);

  const handleProfileNameUpdate = useCallback(async () => {
    if (!editingProfile) return;
    try {
      await axios.put(`/api/v1/accounts/${editingProfile.account_id}/profiles/${editingProfile.id}`, {
        name: newName,
      });
      setProfilesByAccount((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((accountId) => {
          updated[Number(accountId)] = updated[Number(accountId)].map((p) =>
            p.id === editingProfile.id ? { ...p, name: newName } : p,
          );
        });
        return updated;
      });
      setEditingProfile(null);
      setNewName('');
    } catch (err) {
      setError('Failed to update profile name: ' + err);
    }
  }, [editingProfile, newName]);

  const handleDeleteAccount = useCallback(async () => {
    if (!accountIdToDelete) return;
    try {
      await axios.delete(`/api/v1/accounts/${accountIdToDelete}`);
      setAccounts((prev) => prev.filter((a) => a.account_id !== accountIdToDelete));
      setAccountIdToDelete(null);
    } catch (err) {
      setError('Failed to delete account: ' + err);
    }
  }, [accountIdToDelete]);

  const handleDeleteProfile = useCallback(async () => {
    if (!profileToDelete) return;
    const { accountId, profileId } = profileToDelete;

    const account = accounts.find((a) => a.account_id === accountId);
    if (account?.default_profile_id === profileId) {
      setError('Cannot delete default profile');
      setProfileToDelete(null);
      return;
    }

    try {
      await axios.delete(`/api/v1/accounts/${accountId}/profiles/${profileId}`);
      setProfilesByAccount((prev) => ({
        ...prev,
        [accountId]: prev[accountId].filter((p) => p.id !== profileId),
      }));
      setProfileToDelete(null);
    } catch (err) {
      setError('Failed to delete profile: ' + err);
    }
  }, [profileToDelete, accounts]);

  const formatLastLogin = (date: string) => {
    if (date === null) {
      return 'No Login';
    }
    const lastLogin = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    return lastLogin.toLocaleDateString();
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ my: 4 }}>
        Account Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {accounts.map((account) => (
        <Box key={account.account_id} sx={{ position: 'relative', mb: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Accordion
              expanded={expandedAccount === account.account_id}
              onChange={() => handleAccountExpand(account.account_id)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Avatar src={account.database_image!} sx={{ mr: 2 }}>
                    {account.account_name[0]}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6">{account.account_name}</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        {account.email}
                      </Typography>
                      <Box display="flex" alignItems="center" ml={2}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          Created: {formatLastLogin(account.metadata.creationTime)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" ml={2}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          Last login: {formatLastLogin(account.metadata.lastSignInTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <List>
                  {profilesByAccount[account.account_id]?.map((profile) => (
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
                              {account.default_profile_id === profile.id && (
                                <Chip size="small" label="Default" color="primary" sx={{ mr: 1 }} />
                              )}
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              Created: {new Date(profile.created_at).toLocaleDateString()}
                            </Typography>
                            <Box display="flex" alignItems="center">
                              <Box display="flex" alignItems="center" mr={4}>
                                <MovieIcon sx={{ mr: 1, fontSize: 20 }} />
                                <Typography variant="body2">{profile.favorited_movies || 0} Favorite Movies</Typography>
                              </Box>
                              <Box display="flex" alignItems="center">
                                <TvIcon sx={{ mr: 1, fontSize: 20 }} />
                                <Typography variant="body2">{profile.favorited_shows || 0} Favorite Shows</Typography>
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
                                setProfileToDelete({ accountId: account.account_id, profileId: profile.id });
                              }}
                              size="small"
                              disabled={account.default_profile_id === profile.id}
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
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Action buttons outside the Accordion to avoid nesting buttons */}
          <Box sx={{ ml: 2, display: 'flex', flexDirection: 'row', gap: 1 }}>
            <Tooltip title="Edit Account Name" placement="top">
              <IconButton
                onClick={() => {
                  setEditingAccount(account);
                  setNewName(account.account_name);
                }}
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Account" placement="top">
              <IconButton
                onClick={() => {
                  setAccountIdToDelete(account.account_id);
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
    </Box>
  );
}

export default Accounts;
