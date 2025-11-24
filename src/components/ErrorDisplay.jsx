'use client';
export const dynamic = 'force-dynamic';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

export default function ErrorDisplay({ error, title = 'Error Loading Data' }) {
  const errorMessage = error?.response?.data?.error || error?.message || 'An unknown error occurred';
  const statusCode = error?.response?.status;
  const errorDetails = error?.response?.data;

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Alert severity="error" icon={<ErrorIcon />}>
        <AlertTitle>{title}</AlertTitle>
        <Typography variant="body1" sx={{ mb: 1 }}>
          {errorMessage}
        </Typography>
        {statusCode && (
          <Typography variant="body2" color="text.secondary">
            Status Code: {statusCode}
          </Typography>
        )}
        {errorDetails && typeof errorDetails === 'object' && Object.keys(errorDetails).length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(errorDetails, null, 2)}
            </Typography>
          </Box>
        )}
      </Alert>
    </Box>
  );
}

