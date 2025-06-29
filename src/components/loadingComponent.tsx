import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingComponent() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        mt: 4,
        px: 2,
      }}
    >
      <Typography variant="h2" gutterBottom>
        Loading...
      </Typography>
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    </Box>
  );
}
