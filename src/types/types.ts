export interface Account {
  uid: string;
  account_id: number;
  account_name: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
    lastRefreshTime: string | null;
  };
  default_profile_id: number | null;
  database_image: string | null;
  database_created_at: Date;
}

export interface Profile {
  id: number;
  account_id: number;
  name: string;
  image?: string;
  created_at: string;
  favorited_shows: number;
  favorited_movies: number;
}

export interface SystemNotification {
  id: string;
  message: string;
  start_date: string;
  end_date: string;
  send_to_all: boolean;
  account_id: number | null;
  status: 'active' | 'inactive';
}

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

export interface UserFormData {
  username: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
}
