import { useEffect, useState, useRef } from 'react';
import { LogEntry } from '@ajgifford/keepwatching-types';
import { auth } from '../app/firebaseConfig';

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
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const abortController = new AbortController();

    const connect = async () => {
      try {
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;

        const baseUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${baseUrl}${url}`, {
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`SSE connection failed: ${response.status} ${body}`);
        }

        if (!response.body) {
          throw new Error('SSE response has no body');
        }

        setIsConnected(true);
        setError(null);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const logEntry: LogEntry = JSON.parse(data);
              if (isPausedRef.current) {
                pendingLogsRef.current.push(logEntry);
              } else {
                setLogs((prevLogs) => [...prevLogs, logEntry].slice(-MAX_LOGS));
              }
            } catch (parseError) {
              console.error('Error parsing log entry:', parseError);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setIsConnected(false);
        setError(err as Error);
        console.error('SSE error:', err);
      }
    };

    connect();

    return () => {
      abortController.abort();
      setIsConnected(false);
    };
  }, [url]);

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
