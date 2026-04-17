import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import { useAppSelector } from '../app/hooks';
import { selectAuthLoading, selectAuthUser } from '../app/slices/authSlice';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAppSelector(selectAuthUser);
  const loading = useAppSelector(selectAuthLoading);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
