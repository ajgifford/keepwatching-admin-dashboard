/**
 * Converts a cron expression to a human-readable string
 */
export function cronToHumanReadable(cronExpression: string): string {
  const parts = cronExpression.split(' ');

  if (parts.length !== 5) {
    return 'Invalid cron expression';
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Daily patterns
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    if (minute === '*' && hour === '*') {
      return 'Every minute';
    }
    if (minute !== '*' && hour !== '*') {
      return `Daily at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    if (hour !== '*' && minute === '*') {
      return `Every minute during hour ${hour}`;
    }
  }

  // Weekly patterns
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = parseDayOfWeek(dayOfWeek);
    if (minute !== '*' && hour !== '*') {
      return `Weekly on ${days} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
  }

  // Monthly patterns
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    if (minute !== '*' && hour !== '*') {
      // Handle multiple days (e.g., "7,14,21,28")
      if (dayOfMonth.includes(',')) {
        const days = dayOfMonth.split(',').join(', ');
        return `Monthly on days ${days} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      }
      return `Monthly on day ${dayOfMonth} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
  }

  return cronExpression;
}

function parseDayOfWeek(dayOfWeek: string): string {
  const dayMap: Record<string, string> = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday',
    '7': 'Sunday',
  };

  if (dayOfWeek in dayMap) {
    return dayMap[dayOfWeek];
  }

  // Handle comma-separated days
  if (dayOfWeek.includes(',')) {
    return dayOfWeek
      .split(',')
      .map((d) => dayMap[d] || d)
      .join(', ');
  }

  return dayOfWeek;
}

export interface FrequencyConfig {
  type: 'daily' | 'weekly' | 'monthly';
  hour: number;
  minute: number;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number | number[]; // 1-31 for monthly, or array for multiple days
}

/**
 * Converts a frequency configuration to a cron expression
 */
export function frequencyToCron(config: FrequencyConfig): string {
  const { type, hour, minute, dayOfWeek, dayOfMonth } = config;

  switch (type) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek ?? 0}`;
    case 'monthly': {
      const days = Array.isArray(dayOfMonth) ? dayOfMonth.join(',') : (dayOfMonth ?? 1);
      return `${minute} ${hour} ${days} * *`;
    }
    default:
      return '0 0 * * *';
  }
}

/**
 * Parses a cron expression into a frequency configuration
 */
export function cronToFrequency(cronExpression: string): FrequencyConfig | null {
  const parts = cronExpression.split(' ');

  if (parts.length !== 5) {
    return null;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const minuteNum = parseInt(minute, 10);
  const hourNum = parseInt(hour, 10);

  // Daily pattern
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return {
      type: 'daily',
      hour: hourNum,
      minute: minuteNum,
    };
  }

  // Weekly pattern
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    return {
      type: 'weekly',
      hour: hourNum,
      minute: minuteNum,
      dayOfWeek: parseInt(dayOfWeek, 10),
    };
  }

  // Monthly pattern
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    // Handle multiple days (e.g., "7,14,21,28")
    if (dayOfMonth.includes(',')) {
      const days = dayOfMonth.split(',').map((d) => parseInt(d, 10));
      return {
        type: 'monthly',
        hour: hourNum,
        minute: minuteNum,
        dayOfMonth: days,
      };
    }

    return {
      type: 'monthly',
      hour: hourNum,
      minute: minuteNum,
      dayOfMonth: parseInt(dayOfMonth, 10),
    };
  }

  return null;
}
