import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from '@mui/material';

interface ActivityLog {
  id: string;
  action: string;
  device: string;
  location: string;
  timestamp: string;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

const AccountUtilities: React.FC = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      action: 'Login',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      timestamp: '2025-06-03T15:30:00Z',
    },
    {
      id: '2',
      action: 'Password Changed',
      device: 'Firefox on MacOS',
      location: 'Delhi, India',
      timestamp: '2025-06-02T10:15:00Z',
    },
  ]);

  const [activeSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      lastActive: '2025-06-03T15:30:00Z',
      current: true,
    },
    {
      id: '2',
      device: 'Mobile App on iPhone',
      location: 'Delhi, India',
      lastActive: '2025-06-03T14:45:00Z',
      current: false,
    },
  ]);

  const handleLogoutOtherDevices = () => {
    // Here you would typically send a request to your API to invalidate other sessions
    console.log('Logging out other devices');
  };

  const handleDeleteAccount = () => {
    // Here you would typically send a request to your API to delete the account
    console.log('Deleting account');
    setDeleteDialogOpen(false);
  };

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Activity History */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Paper>
            <List>
              {activityLogs.map((log) => (
                <ListItem key={log.id}>
                  <ListItemText
                    primary={log.action}
                    secondary={
                      <>
                        {new Date(log.timestamp).toLocaleString()} • {log.device} •{' '}
                        {log.location}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Active Sessions</Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLogoutOtherDevices}
            >
              Logout Other Devices
            </Button>
          </Box>
          <Paper>
            <List>
              {activeSessions.map((session) => (
                <ListItem key={session.id}>
                  <ListItemText
                    primary={
                      <>
                        {session.device}
                        {session.current && ' (Current Session)'}
                      </>
                    }
                    secondary={
                      <>
                        Last active:{' '}
                        {new Date(session.lastActive).toLocaleString()} •{' '}
                        {session.location}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Delete Account Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
            <Typography variant="h6" gutterBottom color="error">
              Danger Zone
            </Typography>
            <Typography variant="body2" paragraph>
              Once you delete your account, there is no going back. Please be
              certain.
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you absolutely sure you want to delete your account? This action
            cannot be undone and will permanently delete all your data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountUtilities;
