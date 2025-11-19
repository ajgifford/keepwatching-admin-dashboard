# Log Streaming API - Server-Sent Events (SSE)

## Overview

The KeepWatching Admin Server provides a **real-time log streaming endpoint** using Server-Sent Events (SSE). This allows the admin dashboard to display live application logs as they are written, without polling or WebSocket complexity.

## Endpoint

```
GET /api/v1/logs/stream
```

**Protocol:** Server-Sent Events (SSE)
**Authentication:** Required (use your standard auth headers)
**Content-Type:** `text/event-stream`

## What is SSE?

Server-Sent Events is a standard for **one-way, server-to-client** real-time communication over HTTP. Unlike WebSockets:

- ✅ Uses standard HTTP (works through proxies/firewalls)
- ✅ Automatic reconnection built into browser API
- ✅ Simpler than WebSockets for one-way data flow
- ✅ Text-based protocol (easy to debug)
- ❌ Server → Client only (no client messages needed for logs)

## Data Format

### Log Entry Type

Each SSE message contains a JSON-encoded log entry:

```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601 format: "2025-01-15T12:00:00.000Z"
  service: LogService;      // Which service generated this log
  message: string;          // The actual log message
  level: LogLevel;          // Log severity level
  logFile: string;          // Source file name (e.g., "keepwatching.log")

  // Optional fields (only for certain log types)
  version?: string;         // App version (console logs)
  logId?: string;          // Unique log ID (app logs)
  request?: {              // HTTP request details (app logs)
    url: string;
    method: string;
    body: object;
    params: object;
    query: object;
  };
  response?: {             // HTTP response details (app logs)
    statusCode: number;
    body: object;
  };
}
```

### Enums

```typescript
enum LogService {
  APP = 'app',                    // Express application logs
  NGINX = 'nginx',                // Nginx access logs
  CONSOLE = 'console',            // PM2 console output
  CONSOLE_ERROR = 'console_error', // PM2 error output
  SYSTEM = 'system'               // System messages
}

enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}
```

## Quick Start

### Vanilla JavaScript

```javascript
// Establish SSE connection
const eventSource = new EventSource('http://localhost:3001/api/v1/logs/stream', {
  withCredentials: true  // Include auth cookies
});

// Handle incoming log messages
eventSource.onmessage = (event) => {
  const logEntry = JSON.parse(event.data);
  console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.service}: ${logEntry.message}`);
};

// Handle connection errors
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);

  // Browser will automatically attempt to reconnect
  // You can close manually if needed:
  // eventSource.close();
};

// Cleanup when done
window.addEventListener('beforeunload', () => {
  eventSource.close();
});
```

### React Hook (TypeScript)

```typescript
import { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: string;
  service: string;
  message: string;
  level: string;
  logFile: string;
}

export function useLogStream(url: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        const logEntry: LogEntry = JSON.parse(event.data);

        setLogs((prevLogs) => {
          // Keep only last 1000 logs to prevent memory issues
          const newLogs = [...prevLogs, logEntry];
          return newLogs.slice(-1000);
        });
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
  }, [url]);

  return { logs, isConnected, error };
}

// Usage in component:
function LogViewer() {
  const { logs, isConnected, error } = useLogStream(
    'http://localhost:3001/api/v1/logs/stream'
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div className="logs">
        {logs.map((log, index) => (
          <div key={index} className={`log-entry log-${log.level}`}>
            <span className="timestamp">{log.timestamp}</span>
            <span className="service">{log.service}</span>
            <span className="level">{log.level}</span>
            <span className="message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue 3 Composition API

```typescript
import { ref, onMounted, onUnmounted } from 'vue';

export function useLogStream(url: string) {
  const logs = ref<LogEntry[]>([]);
  const isConnected = ref(false);
  const error = ref<Error | null>(null);
  let eventSource: EventSource | null = null;

  const connect = () => {
    try {
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onopen = () => {
        isConnected.value = true;
        error.value = null;
      };

      eventSource.onmessage = (event) => {
        const logEntry = JSON.parse(event.data);
        logs.value.push(logEntry);

        // Keep only last 1000 logs
        if (logs.value.length > 1000) {
          logs.value.shift();
        }
      };

      eventSource.onerror = (err) => {
        isConnected.value = false;
        error.value = new Error('SSE connection failed');
        console.error('SSE error:', err);
      };
    } catch (err) {
      error.value = err as Error;
    }
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      isConnected.value = false;
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return { logs, isConnected, error, disconnect, connect };
}
```

## Log Sources

The server streams from multiple log files simultaneously:

| Source | Description | Example Message |
|--------|-------------|-----------------|
| **nginx** | Nginx access logs | `"192.168.1.1 - - [15/Jan/2025] GET /api/users 200"` |
| **KeepWatching-App** | Express app logs (JSON) | `{"timestamp":"...","level":"info","message":"User authenticated"}` |
| **KeepWatching-App-Error** | Express error logs | Stack traces and error details |
| **KeepWatching-Console** | PM2 stdout | Console output from app |
| **KeepWatching-Console-Error** | PM2 stderr | Error output from app |

## Message Types

### 1. System Status Message (Initial)

When you first connect, you'll receive a status message:

```json
{
  "timestamp": "2025-01-15T12:00:00.000Z",
  "service": "system",
  "message": "Log streaming started. Available logs: [nginx, KeepWatching-App, KeepWatching-Console]",
  "level": "info"
}
```

### 2. File Not Found Warning

If a log file doesn't exist:

```json
{
  "timestamp": "2025-01-15T12:00:00.000Z",
  "service": "system",
  "message": "Log file not found: /var/log/nginx/access.log",
  "level": "warn",
  "logFile": "access.log"
}
```

### 3. Regular Log Entry

Standard log from application:

```json
{
  "timestamp": "2025-01-15T12:05:30.123Z",
  "service": "app",
  "message": "User login successful",
  "level": "info",
  "logFile": "keepwatching-January-15-2025.log",
  "logId": "abc123",
  "request": {
    "url": "/api/auth/login",
    "method": "POST",
    "body": { "email": "user@example.com" }
  }
}
```

### 4. Error with Stack Trace

Multiline errors are buffered and sent as one message:

```json
{
  "timestamp": "2025-01-15T12:10:00.456Z",
  "service": "app",
  "message": "TypeError: Cannot read property 'foo' of undefined\n    at someFunction (/app/server.js:123:45)\n    at anotherFunction (/app/server.js:456:78)",
  "level": "error",
  "logFile": "keepwatching-error.log"
}
```

## Advanced Usage

### Filtering Logs Client-Side

```typescript
function LogViewer() {
  const { logs } = useLogStream('http://localhost:3001/api/v1/logs/stream');
  const [filter, setFilter] = useState({
    service: null as string | null,
    level: null as string | null,
    searchTerm: ''
  });

  const filteredLogs = logs.filter(log => {
    if (filter.service && log.service !== filter.service) return false;
    if (filter.level && log.level !== filter.level) return false;
    if (filter.searchTerm && !log.message.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* Filter controls */}
      <select onChange={e => setFilter({...filter, service: e.target.value || null})}>
        <option value="">All Services</option>
        <option value="app">App</option>
        <option value="nginx">Nginx</option>
        <option value="console">Console</option>
      </select>

      <select onChange={e => setFilter({...filter, level: e.target.value || null})}>
        <option value="">All Levels</option>
        <option value="info">Info</option>
        <option value="warn">Warning</option>
        <option value="error">Error</option>
      </select>

      <input
        type="text"
        placeholder="Search logs..."
        onChange={e => setFilter({...filter, searchTerm: e.target.value})}
      />

      {/* Render filtered logs */}
      {filteredLogs.map((log, i) => (
        <LogEntry key={i} log={log} />
      ))}
    </div>
  );
}
```

### Auto-scroll to Bottom

```typescript
function LogViewer() {
  const { logs } = useLogStream('http://localhost:3001/api/v1/logs/stream');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div className="log-viewer">
      <label>
        <input
          type="checkbox"
          checked={autoScroll}
          onChange={e => setAutoScroll(e.target.checked)}
        />
        Auto-scroll to bottom
      </label>

      <div className="logs-container">
        {logs.map((log, i) => (
          <LogEntry key={i} log={log} />
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
```

### Syntax Highlighting for JSON Logs

```typescript
function LogMessage({ log }: { log: LogEntry }) {
  // Try to parse message as JSON for pretty display
  let displayMessage = log.message;
  let isJson = false;

  try {
    const parsed = JSON.parse(log.message);
    displayMessage = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    // Not JSON, display as-is
  }

  return (
    <div className="log-message">
      {isJson ? (
        <pre className="json-log">
          <code>{displayMessage}</code>
        </pre>
      ) : (
        <span className="text-log">{displayMessage}</span>
      )}
    </div>
  );
}
```

### Connection Status Indicator

```typescript
function ConnectionStatus({ isConnected, error }: { isConnected: boolean, error: Error | null }) {
  if (error) {
    return (
      <div className="status error">
        🔴 Connection Error: {error.message}
      </div>
    );
  }

  return (
    <div className={`status ${isConnected ? 'connected' : 'connecting'}`}>
      {isConnected ? '🟢 Connected' : '🟡 Connecting...'}
    </div>
  );
}
```

## Best Practices

### 1. Memory Management

SSE connections can accumulate large amounts of data. Implement log rotation:

```typescript
const MAX_LOGS = 1000;

eventSource.onmessage = (event) => {
  const logEntry = JSON.parse(event.data);

  setLogs(prevLogs => {
    const newLogs = [...prevLogs, logEntry];
    // Keep only the most recent logs
    return newLogs.slice(-MAX_LOGS);
  });
};
```

### 2. Cleanup on Unmount

Always close the connection when component unmounts:

```typescript
useEffect(() => {
  const eventSource = new EventSource(url);

  // ... setup handlers

  return () => {
    eventSource.close(); // Critical!
  };
}, []);
```

### 3. Error Recovery

The browser automatically reconnects, but you may want to add manual retry logic:

```typescript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

eventSource.onerror = () => {
  reconnectAttempts++;

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    eventSource.close();
    alert('Failed to connect to log stream after 5 attempts');
  }
};

eventSource.onopen = () => {
  reconnectAttempts = 0; // Reset on successful connection
};
```

### 4. Virtual Scrolling for Performance

With thousands of logs, render performance can suffer. Use virtualization:

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

function LogViewer() {
  const { logs } = useLogStream(url);

  const Row = ({ index, style }) => (
    <div style={style}>
      <LogEntry log={logs[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={logs.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Troubleshooting

### Connection Fails Immediately

**Issue:** `EventSource` error fires immediately

**Solutions:**
1. Check CORS configuration on server
2. Verify authentication headers/cookies
3. Check URL is correct (include protocol: `http://` or `https://`)
4. Open browser Network tab and check for 401/403/404 responses

### No Messages Received

**Issue:** Connection succeeds but no log messages appear

**Solutions:**
1. Verify log files exist on server (check initial status message)
2. Generate some activity (make API requests) to create new logs
3. Check browser console for JSON parsing errors
4. Verify `onmessage` handler is properly attached

### Memory Leak

**Issue:** Browser tab becomes slow/crashes over time

**Solutions:**
1. Implement log rotation (keep only last N logs)
2. Use virtual scrolling for rendering
3. Close connection when tab is not visible:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    eventSource.close();
  } else {
    // Reconnect
    eventSource = new EventSource(url);
  }
});
```

### CORS Errors

**Issue:** `Access-Control-Allow-Origin` errors

**Server-side fix (already configured):**
```typescript
app.use(cors()); // Server has this enabled
```

**Client-side:**
```typescript
const eventSource = new EventSource(url, {
  withCredentials: true  // Required for cookies/auth
});
```

## Testing

### Mock SSE for Development

Create a mock SSE server for local development:

```typescript
// mockLogStream.ts
export function createMockLogStream() {
  const logs = [
    { timestamp: new Date().toISOString(), service: 'app', message: 'App started', level: 'info' },
    { timestamp: new Date().toISOString(), service: 'nginx', message: 'GET /api/users 200', level: 'info' },
    { timestamp: new Date().toISOString(), service: 'app', message: 'Error occurred', level: 'error' },
  ];

  let index = 0;

  return {
    subscribe: (callback: (log: LogEntry) => void) => {
      const interval = setInterval(() => {
        callback(logs[index % logs.length]);
        index++;
      }, 2000);

      return () => clearInterval(interval);
    }
  };
}
```

## Example: Complete Log Dashboard Component

```typescript
import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  service: string;
  message: string;
  level: string;
  logFile: string;
}

export function LogDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filters, setFilters] = useState({
    service: '',
    level: '',
    search: ''
  });
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/v1/logs/stream', {
      withCredentials: true
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (!isPaused) {
        const logEntry: LogEntry = JSON.parse(event.data);
        setLogs(prev => [...prev, logEntry].slice(-1000));
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [isPaused]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filters.service && log.service !== filters.service) return false;
    if (filters.level && log.level !== filters.level) return false;
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const clearLogs = () => setLogs([]);

  return (
    <div className="log-dashboard">
      <div className="controls">
        <div className="status">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>

        <select value={filters.service} onChange={e => setFilters({...filters, service: e.target.value})}>
          <option value="">All Services</option>
          <option value="app">App</option>
          <option value="nginx">Nginx</option>
          <option value="console">Console</option>
        </select>

        <select value={filters.level} onChange={e => setFilters({...filters, level: e.target.value})}>
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>

        <input
          type="text"
          placeholder="Search logs..."
          value={filters.search}
          onChange={e => setFilters({...filters, search: e.target.value})}
        />

        <button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>

        <button onClick={clearLogs}>🗑️ Clear</button>

        <span className="log-count">{filteredLogs.length} logs</span>
      </div>

      <div className="logs">
        {filteredLogs.map((log, i) => (
          <div key={i} className={`log-entry log-${log.level}`}>
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`service service-${log.service}`}>{log.service}</span>
            <span className={`level level-${log.level}`}>{log.level}</span>
            <span className="message">{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
```

## API Reference

### Endpoint Details

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/logs/stream` |
| **Method** | `GET` |
| **Protocol** | SSE (Server-Sent Events) |
| **Authentication** | Required |
| **Rate Limiting** | Applied (same as other `/api/` routes) |
| **Max Connections** | 30 concurrent (server limit) |
| **Auto-Reconnect** | Yes (handled by browser) |
| **Timeout** | None (persistent connection) |

### Response Headers

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### SSE Message Format

```
data: <JSON-encoded-log-entry>

```

Each message:
- Starts with `data: `
- Contains JSON object
- Ends with two newlines

## Performance Considerations

- **Server**: Can handle ~30 concurrent SSE connections
- **Client**: Keep max 1000 logs in memory (configurable)
- **Network**: Minimal bandwidth (~1KB per log entry)
- **Latency**: Near real-time (<100ms from write to display)

## Security

- ✅ Authentication required (your existing auth mechanism)
- ✅ CORS configured on server
- ✅ Rate limiting applied
- ✅ No log data stored on client (streamed only)
- ⚠️ Use HTTPS in production to encrypt log data

## Additional Resources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [SSE vs WebSocket](https://www.ably.io/topic/websockets-vs-sse)

## Support

For issues or questions about the log streaming API:
1. Check server logs: `/var/log/keepwatching/`
2. Verify endpoint is accessible: `GET /api/v1/logs`
3. Contact backend team with:
   - Browser console errors
   - Network tab screenshot
   - Expected vs actual behavior
