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
      return JSON.stringify(obj, null, 0);
    } catch (e) {
      return String(obj);
    }
  };

  const hasContent = (obj: any): boolean => {
    if (!obj) return false;
    if (typeof obj === 'string' && obj.trim() === '') return false;
    if (typeof obj === 'object') {
      // Check if it's an empty object or only contains empty/null values
      const keys = Object.keys(obj);
      if (keys.length === 0) return false;
      return keys.some((key) => {
        const value = obj[key];
        return value !== null && value !== undefined && value !== '';
      });
    }
    return true;
  };

  const requestMethod = entry.request?.method || '';
  const requestUrl = entry.request?.url || '';
  const statusCode = entry.response?.statusCode;

  const requestParamContent = formatJsonObject(entry.request?.params);
  const requestQueryContent = formatJsonObject(entry.request?.query);
  const requestBodyContent = formatJsonObject(entry.request?.body);
  const responseBodyContent = formatJsonObject(entry.response?.body);

  const showRequestParams = hasContent(entry.request?.params) && requestParamContent.trim() !== '';
  const showRequestQuery = hasContent(entry.request?.query) && requestQueryContent.trim() !== '';
  const showRequestBody = hasContent(entry.request?.body) && requestBodyContent.trim() !== '';
  const showResponseBody = hasContent(entry.response?.body) && responseBodyContent.trim() !== '';

  // Build combined request details content
  const buildCombinedRequestContent = (): string => {
    const sections: string[] = [];

    if (showRequestParams) {
      sections.push(`Params:\n${requestParamContent}`);
    }

    if (showRequestQuery) {
      sections.push(`Query:\n${requestQueryContent}`);
    }

    if (showRequestBody) {
      sections.push(`Body:\n${requestBodyContent}`);
    }

    return sections.join('\n\n');
  };

  const combinedRequestContent = buildCombinedRequestContent();
  const hasRequestDetails = showRequestParams || showRequestQuery || showRequestBody;

  return (
    <Box sx={{ fontSize: '0.9rem' }}>
      <Typography variant="subtitle2">Log Id: {entry.logId}</Typography>

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
        Request: {requestMethod} {requestUrl}
      </Typography>

      {hasRequestDetails && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Request Details:
          </Typography>
          <TruncatedLogContent content={combinedRequestContent} maxLength={200} />
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
        Response: {statusCode && `${statusCode} ${statusCode >= 200 && statusCode < 300 ? '✓' : '✗'}`}
      </Typography>

      {showResponseBody && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Body:
          </Typography>
          <TruncatedLogContent content={responseBodyContent} maxLength={150} />
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
