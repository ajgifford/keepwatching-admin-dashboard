import React from 'react';

import { Box, Divider, Typography } from '@mui/material';

import TruncatedLogContent from './truncatedLogContent';
import { AppLogEntry, ErrorLogEntry, NginxLogEntry } from '@ajgifford/keepwatching-types';

interface AppLogEntryViewerProps {
  entry: AppLogEntry;
}

export const AppLogEntryViewer: React.FC<AppLogEntryViewerProps> = ({ entry }) => {
  const formatJsonObject = (obj: any): string => {
    if (!obj) return '';
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  const requestMethod = entry.request?.method || '';
  const requestUrl = entry.request?.url || '';

  const statusCode = entry.response?.statusCode;

  const requestBody = formatJsonObject(entry.request?.body);
  const responseBody = formatJsonObject(entry.response?.body);

  return (
    <Box sx={{ fontSize: '0.9rem' }}>
      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
        Request: {requestMethod} {requestUrl}
      </Typography>

      {requestBody && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Body:
          </Typography>
          <TruncatedLogContent content={requestBody} maxLength={150} />
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
        Response: {statusCode && `${statusCode} ${statusCode >= 200 && statusCode < 300 ? '✓' : '✗'}`}
      </Typography>

      {responseBody && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Body:
          </Typography>
          <TruncatedLogContent content={responseBody} maxLength={150} />
        </Box>
      )}
    </Box>
  );
};

export const NginxLogEntryViewer: React.FC<{ entry: NginxLogEntry }> = ({ entry }) => {
  const combinedMetadata = `User Agent: ${entry.httpUserAgent}${entry.httpReferer ? `\nReferer: ${entry.httpReferer}` : ''}`;

  return (
    <Box>
      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
        {entry.request} - {entry.status}
      </Typography>

      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" component="div">
          <Box component="span" sx={{ color: 'text.secondary' }}>
            Remote Address:
          </Box>{' '}
          {entry.remoteAddr}
        </Typography>

        <Box sx={{ mt: 0.5 }}>
          <TruncatedLogContent content={combinedMetadata} maxLength={150} />
        </Box>
      </Box>
    </Box>
  );
};

export const ErrorLogEntryViewer: React.FC<{ entry: ErrorLogEntry }> = ({ entry }) => {
  const stackTrace = Array.isArray(entry.stack)
    ? entry.stack.join('\n')
    : typeof entry.stack === 'string'
      ? entry.stack
      : JSON.stringify(entry.stack);

  return (
    <Box>
      {entry.details && (
        <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>
          {entry.details}
        </Typography>
      )}

      <TruncatedLogContent content={stackTrace} maxLength={200} />
    </Box>
  );
};

export const GenericLogEntryViewer: React.FC<{ content: string }> = ({ content }) => {
  return <></>;
};
