'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE_URL}/api`;

function getApiInstance() {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

export default function Demos() {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trialToDelete, setTrialToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const response = await api.get('/free-trial/all');
      
      // Map trials data
      const trialsData = (response.data || []).map(trial => ({
        _id: trial._id,
        userId: trial.userId,
        organizationId: trial.organizationId,
        segment: trial.organizationId?.segment || (trial.userId?.accountType === 'business' ? 'B2B' : trial.userId?.accountType === 'education' ? 'B2E' : 'B2C'),
        packageId: trial.packageId,
        uniqueCode: trial.uniqueCode,
        status: trial.status,
        usedSeats: trial.usedSeats || 0,
        maxSeats: trial.maxSeats || 0,
        completionPercentage: trial.usedSeats && trial.maxSeats ? Math.round((trial.usedSeats / trial.maxSeats) * 100) : 0,
        startDate: trial.createdAt,
        endDate: trial.endDate,
        createdAt: trial.createdAt
      }));
      
      // Sort by date (newest first)
      trialsData.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt);
        const dateB = new Date(b.startDate || b.createdAt);
        return dateB - dateA;
      });
      
      setTrials(trialsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching trials:', err);
      setError(err.response?.data?.error || 'Failed to load trials');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (trial) => {
    setTrialToDelete(trial);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setTrialToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!trialToDelete) return;

    try {
      setDeleting(true);
      const api = getApiInstance();
      await api.delete(`/free-trial/${trialToDelete._id}`);
      
      fetchTrials();
      handleCloseDelete();
      setError(null);
    } catch (err) {
      console.error('Error deleting trial:', err);
      setError(err.response?.data?.error || 'Failed to delete trial');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trials
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User/Organization</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell>Package</TableCell>
              <TableCell>Unique Code</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Seats Used</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">No trials found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              trials.map((trial) => {
                const userOrOrg = trial.organizationId || trial.userId;
                return (
                  <TableRow key={trial._id}>
                    <TableCell>
                      {userOrOrg?.name || userOrOrg?.email || 'N/A'}
                      {trial.organizationId && <Chip label="Organization" size="small" sx={{ ml: 1 }} />}
                      {trial.userId && !trial.organizationId && <Chip label="User" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>
                      {trial.segment ? (
                        <Chip label={trial.segment} size="small" />
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {trial.packageId?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {trial.uniqueCode || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trial.status}
                        color={
                          trial.status === 'completed' ? 'success' :
                          trial.status === 'expired' ? 'error' :
                          trial.status === 'active' ? 'primary' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={trial.completionPercentage || 0}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 60 }}>
                          {trial.usedSeats}/{trial.maxSeats}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(trial.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {trial.endDate ? new Date(trial.endDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDelete(trial)}
                        color="error"
                        title="Delete Trial"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Trial</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this trial? This action cannot be undone.
            {trialToDelete && (
              <>
                <br />
                <br />
                <strong>Trial Details:</strong>
                <br />
                User/Organization: {trialToDelete.organizationId?.name || trialToDelete.userId?.name || trialToDelete.userId?.email || 'N/A'}
                <br />
                Package: {trialToDelete.packageId?.name || 'N/A'}
                <br />
                Unique Code: {trialToDelete.uniqueCode || 'N/A'}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

