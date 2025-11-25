import { useEffect, useState, useRef } from 'react';
import { LogEntry } from '@ajgifford/keepwatching-types';

interface UseLogStreamReturn {
  logs: LogEntry[];
  isConnected: boolean;
  error: Error | null;
  clearLogs: () => void;
  pauseStream: () => void;
  resumeStream: () => void;
  isPaused: boolean;
}

const MAX_LOGS = 1000;

export function useLogStream(url: string): UseLogStreamReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingLogsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      // Create EventSource connection
      eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const logEntry: LogEntry = JSON.parse(event.data);

          if (isPaused) {
            // Buffer logs when paused
            pendingLogsRef.current.push(logEntry);
          } else {
            setLogs((prevLogs) => {
              // Keep only last MAX_LOGS to prevent memory issues
              const newLogs = [...prevLogs, logEntry];
              return newLogs.slice(-MAX_LOGS);
            });
          }
        } catch (parseError) {
          console.error('Error parsing log entry:', parseError);
        }
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        setError(new Error('SSE connection failed'));
        console.error('SSE error:', err);
      };
    } catch (err) {
      setError(err as Error);
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [url, isPaused]);

  const clearLogs = () => {
    setLogs([]);
    pendingLogsRef.current = [];
  };

  const pauseStream = () => {
    setIsPaused(true);
  };

  const resumeStream = () => {
    // When resuming, add any pending logs that accumulated while paused
    if (pendingLogsRef.current.length > 0) {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, ...pendingLogsRef.current];
        pendingLogsRef.current = [];
        return newLogs.slice(-MAX_LOGS);
      });
    }
    setIsPaused(false);
  };

  return {
    logs,
    isConnected,
    error,
    clearLogs,
    pauseStream,
    resumeStream,
    isPaused,
  };
}
