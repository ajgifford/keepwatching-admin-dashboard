import { useNavigate } from 'react-router-dom';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import { Alert, Box, Button, Divider, Paper, Typography } from '@mui/material';

export interface ApiErrorResponse {
  message?: string;
  requestId?: string;
  status?: number;
  error?: {
    code: string;
    message: string;
  };
}

interface ErrorPropTypes {
  error: string | ApiErrorResponse;
  hideHomeButton?: boolean;
}

export function ErrorComponent({ error, hideHomeButton = false }: ErrorPropTypes) {
  const navigate = useNavigate();

  const getErrorMessage = (): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unknown error occurred';
  };

  // Get error code and status if available
  const errorCode = typeof error !== 'string' && error.error?.code;
  const errorStatus = typeof error !== 'string' && error.status;
  const requestId = typeof error !== 'string' && error.requestId;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mt: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: '600px',
          width: '100%',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <ErrorOutlineIcon
            color="error"
            sx={{
              fontSize: 64,
              mb: 1,
            }}
          />

          <Typography variant="h5" component="h2" color="error" align="center" gutterBottom>
            Something went wrong
          </Typography>

          <Alert severity="error" variant="outlined" sx={{ width: '100%', mb: 2 }}>
            {getErrorMessage()}
          </Alert>

          {/* Show additional error details if available */}
          {(errorStatus || errorCode || requestId) && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                {errorStatus && <div>Status: {errorStatus}</div>}
                {errorCode && <div>Code: {errorCode}</div>}
                {requestId && <div>Request ID: {requestId}</div>}
              </Typography>
            </Box>
          )}

          {!hideHomeButton && (
            <Button variant="contained" color="primary" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
              Dashboard
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
