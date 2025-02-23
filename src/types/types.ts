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
  profile_id: number;
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
  service: 'express' | 'nginx' | 'pm2';
  level: 'info' | 'warn' | 'error';
  message: string;
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
