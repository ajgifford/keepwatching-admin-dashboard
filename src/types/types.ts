export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  memory: string;
  cpu: string;
}

export interface LogEntry {
  timestamp: string;
  service: 'App' | 'nginx' | 'Console' | 'Console-Error';
  level: 'info' | 'warn' | 'error';
  message: string;
  version?: string;
  logFile?: string;
}

export interface AppLogEntry extends LogEntry {
  logId: string;
  request?: {
    url?: string;
    method?: string;
    body?: object;
    params?: object;
    query?: object;
  };
  response?: {
    statusCode?: number;
    body?: string;
  };
}

export interface NginxLogEntry extends LogEntry {
  remoteAddr: string;
  remoteUser: string;
  request: string;
  status: number;
  bytesSent: number;
  httpReferer: string;
  httpUserAgent: string;
  gzipRatio?: string;
}

export interface ErrorLogEntry extends LogEntry {
  stack: string[];
  fullText: string;
  details?: string;
}

export interface LogFilter {
  service: string;
  level: string;
  startDate: Date | null;
  endDate: Date | null;
  searchTerm: string;
}
