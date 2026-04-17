import { useState } from 'react';

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
} from '@mui/material';

interface RunPeopleBatchDialogProps {
  open: boolean;
  nextBatch: number;
  onClose: () => void;
  onRun: (batch?: number, runAll?: boolean) => void;
}

const BATCH_COUNT = 12;

const RunPeopleBatchDialog = ({ open, nextBatch, onClose, onRun }: RunPeopleBatchDialogProps) => {
  const [mode, setMode] = useState<'auto' | 'specific' | 'all'>('auto');
  const [specificBatch, setSpecificBatch] = useState(0);

  const handleRun = () => {
    if (mode === 'all') {
      onRun(undefined, true);
    } else {
      onRun(mode === 'specific' ? specificBatch : undefined);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Run People Update Job</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Next auto batch
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={`Batch ${nextBatch}`} color="primary" size="small" />
              <Typography variant="caption" color="text.secondary">
                (batch {nextBatch + 1} of {BATCH_COUNT})
              </Typography>
            </Box>
          </Box>

          <FormControl>
            <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'auto' | 'specific' | 'all')}>
              <FormControlLabel
                value="auto"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">Run next batch</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Runs batch {nextBatch} and advances the counter to batch {(nextBatch + 1) % BATCH_COUNT}
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="specific"
                control={<Radio />}
                label={<Typography variant="body2">Run specific batch</Typography>}
              />
              <FormControlLabel
                value="all"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">Run all batches</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Runs all {BATCH_COUNT} batches sequentially (0–{BATCH_COUNT - 1}). This will take a while.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {mode === 'specific' && (
            <FormControl fullWidth>
              <InputLabel>Batch</InputLabel>
              <Select
                value={specificBatch}
                label="Batch"
                onChange={(e) => setSpecificBatch(e.target.value as number)}
              >
                {Array.from({ length: BATCH_COUNT }, (_, i) => (
                  <MenuItem key={i} value={i}>
                    Batch {i}{i === nextBatch ? ' (next auto)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleRun} variant="contained" color="primary">
          Run
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RunPeopleBatchDialog;
