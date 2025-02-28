import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';

interface TruncatedLogContentProps {
  content: string;
  maxLength?: number;
}

const TruncatedLogContent: React.FC<TruncatedLogContentProps> = ({ content, maxLength = 100 }) => {
  const [expanded, setExpanded] = useState(false);
  
  // If content is empty or undefined, return empty string
  if (!content) return null;
  
  // Check if we need to truncate
  const needsTruncation = content.length > maxLength;
  
  // If no truncation needed or expanded, show full content
  if (!needsTruncation || expanded) {
    return (
      <Box>
        <Typography
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
          }}
        >
          {content}
        </Typography>
        {needsTruncation && expanded && (
          <Button 
            size="small" 
            onClick={() => setExpanded(false)}
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            Show Less
          </Button>
        )}
      </Box>
    );
  }
  
  // Show truncated content with "Show More" button
  return (
    <Box>
      <Typography
        component="pre"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
        }}
      >
        {`${content.substring(0, maxLength)}...`}
      </Typography>
      <Button 
        size="small" 
        onClick={() => setExpanded(true)}
        sx={{ mt: 1, fontSize: '0.75rem' }}
      >
        Show More
      </Button>
    </Box>
  );
};

export default TruncatedLogContent;