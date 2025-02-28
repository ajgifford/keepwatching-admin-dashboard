import React from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { ErrorLogEntry, HTTPLogEntry, NginxLogEntry } from '../types/types';
import TruncatedLogContent from './truncatedLogContent';

interface HTTPLogEntryViewerProps {
  entry: HTTPLogEntry;
}

export const HTTPLogEntryViewer: React.FC<HTTPLogEntryViewerProps> = ({ entry }) => {
  // Format JSON objects for better display
  const formatJsonObject = (obj: any): string => {
    if (!obj) return '';
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  // Get request method and URL
  const requestMethod = entry.request?.method || '';
  const requestUrl = entry.request?.url || '';

  // Get response status code
  const statusCode = entry.response?.statusCode;

  // Format request and response bodies
  const requestBody = formatJsonObject(entry.request?.body);
  const responseBody = formatJsonObject(entry.response?.body);

  return (
    <Box sx={{ fontSize: '0.9rem' }}>
      {/* Request section */}
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

      {/* Response section */}
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

// Component for Nginx log entries
export const NginxLogEntryViewer: React.FC<{ entry: NginxLogEntry }> = ({ entry }) => {
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

        <Typography variant="body2" component="div">
          <Box component="span" sx={{ color: 'text.secondary' }}>
            User Agent:
          </Box>
          <TruncatedLogContent content={entry.httpUserAgent} maxLength={100} />
        </Typography>

        {entry.httpReferer && (
          <Typography variant="body2" component="div">
            <Box component="span" sx={{ color: 'text.secondary' }}>
              Referer:
            </Box>
            <TruncatedLogContent content={entry.httpReferer} maxLength={100} />
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Component for Error log entries
export const ErrorLogEntryViewer: React.FC<{ entry: ErrorLogEntry }> = ({ entry }) => {
  // Join stack trace array into a formatted string
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

// Generic log entry fallback
export const GenericLogEntryViewer: React.FC<{ content: string }> = ({ content }) => {
  return <TruncatedLogContent content={content} maxLength={150} />;
};
