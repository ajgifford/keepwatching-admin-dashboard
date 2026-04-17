import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';

import { signInWithEmail } from '../app/auth';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectAuthError, selectAuthLoading } from '../app/slices/authSlice';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector(selectAuthLoading);
  const authError = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(dispatch, email, password);
      navigate('/');
    } catch {
      // error is already dispatched to Redux by signInWithEmail
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to continue
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="email"
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !email || !password}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
