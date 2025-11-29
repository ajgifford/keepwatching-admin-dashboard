import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';

import { cronToFrequency, frequencyToCron, FrequencyConfig } from '../utils/cronUtils';

interface ChangeFrequencyDialogProps {
  open: boolean;
  jobName: string;
  currentCron: string;
  onClose: () => void;
  onSave: (newCron: string) => void;
}

const ChangeFrequencyDialog = ({ open, jobName, currentCron, onClose, onSave }: ChangeFrequencyDialogProps) => {
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([1]);

  useEffect(() => {
    if (open && currentCron) {
      const config = cronToFrequency(currentCron);
      if (config) {
        setFrequencyType(config.type);
        setHour(config.hour);
        setMinute(config.minute);
        if (config.dayOfWeek !== undefined) setDayOfWeek(config.dayOfWeek);
        if (config.dayOfMonth !== undefined) {
          setDaysOfMonth(Array.isArray(config.dayOfMonth) ? config.dayOfMonth : [config.dayOfMonth]);
        }
      }
    }
  }, [open, currentCron]);

  const handleSave = () => {
    const config: FrequencyConfig = {
      type: frequencyType,
      hour,
      minute,
      ...(frequencyType === 'weekly' && { dayOfWeek }),
      ...(frequencyType === 'monthly' && { dayOfMonth: daysOfMonth.length === 1 ? daysOfMonth[0] : daysOfMonth }),
    };

    const newCron = frequencyToCron(config);
    onSave(newCron);
    onClose();
  };

  const handleDaysOfMonthChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    setDaysOfMonth(typeof value === 'string' ? [] : value);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Frequency for {jobName}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Frequency Type</InputLabel>
            <Select
              value={frequencyType}
              label="Frequency Type"
              onChange={(e) => setFrequencyType(e.target.value as 'daily' | 'weekly' | 'monthly')}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Hour (0-23)"
              type="number"
              value={hour}
              onChange={(e) => setHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
              inputProps={{ min: 0, max: 23 }}
              fullWidth
            />
            <TextField
              label="Minute (0-59)"
              type="number"
              value={minute}
              onChange={(e) => setMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              inputProps={{ min: 0, max: 59 }}
              fullWidth
            />
          </Box>

          {frequencyType === 'weekly' && (
            <FormControl fullWidth>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={dayOfWeek}
                label="Day of Week"
                onChange={(e) => setDayOfWeek(e.target.value as number)}
              >
                {daysOfWeek.map((day, index) => (
                  <MenuItem key={index} value={index}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {frequencyType === 'monthly' && (
            <FormControl fullWidth>
              <InputLabel>Days of Month</InputLabel>
              <Select
                multiple
                value={daysOfMonth}
                onChange={handleDaysOfMonthChange}
                input={<OutlinedInput label="Days of Month" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.sort((a, b) => a - b).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {monthDays.map((day) => (
                  <MenuItem key={day} value={day}>
                    Day {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Preview:
            </Typography>
            <Typography variant="body1">
              {frequencyType === 'daily' && `Every day at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
              {frequencyType === 'weekly' &&
                `Every ${daysOfWeek[dayOfWeek]} at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
              {frequencyType === 'monthly' &&
                `${daysOfMonth.length === 1 ? `Day ${daysOfMonth[0]}` : `Days ${daysOfMonth.sort((a, b) => a - b).join(', ')}`} of every month at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cron:{' '}
              {frequencyToCron({
                type: frequencyType,
                hour,
                minute,
                dayOfWeek,
                dayOfMonth: daysOfMonth.length === 1 ? daysOfMonth[0] : daysOfMonth,
              })}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeFrequencyDialog;
