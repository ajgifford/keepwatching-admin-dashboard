import { Card, CardContent, Typography } from '@mui/material';

import { DailySummary } from '@ajgifford/keepwatching-types';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PerformanceTrendChartProps {
  data: DailySummary[];
  queryName: string;
}

export default function PerformanceTrendChart({ data, queryName }: PerformanceTrendChartProps) {
  // Transform data for recharts
  const chartData = data.map((summary) => ({
    date: new Date(summary.archiveDate).toLocaleDateString(),
    avgDuration: Number(Number(summary.avgDurationInMillis || 0).toFixed(2)),
    maxDuration: Number(Number(summary.maxDurationInMillis || 0).toFixed(2)),
    minDuration: Number(Number(summary.minDurationInMillis || 0).toFixed(2)),
    p95Duration: summary.p95DurationInMillis ? Number(Number(summary.p95DurationInMillis).toFixed(2)) : null,
    executions: summary.totalExecutions,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Trends
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {queryName}
        </Typography>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Executions', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgDuration"
              stroke="#8884d8"
              name="Avg Duration"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="maxDuration"
              stroke="#ff7300"
              name="Max Duration"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="minDuration"
              stroke="#00C49F"
              name="Min Duration"
              strokeWidth={2}
            />
            {chartData.some((d) => d.p95Duration !== null) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="p95Duration"
                stroke="#FFBB28"
                name="P95 Duration"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="executions"
              stroke="#82ca9d"
              name="Executions"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
