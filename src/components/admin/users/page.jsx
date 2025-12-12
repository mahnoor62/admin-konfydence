'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
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

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      const segment = tabValue === 0 ? 'B2C' : tabValue === 1 ? 'B2B' : 'B2E';
      const response = await api.get('/users', { params: { segment } });
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    fetchUsers();
  }, [tabValue, fetchUsers]);

  const handleViewDetail = async (userId) => {
    try {
      const api = getApiInstance();
      const response = await api.get(`/users/${userId}`);
      setSelectedUser(response.data);
      setDetailOpen(true);
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setError(err.response?.data?.error || 'Failed to load user details');
    }
  };

  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const api = getApiInstance();
      
      // Delete user - backend will handle OrgUser cleanup
      await api.delete(`/users/${userToDelete._id}`);
      
      fetchUsers();
      handleCloseDelete();
      setError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
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
        Users
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="B2C Users" />
        <Tab label="B2B Users" />
        <Tab label="B2E Users" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              {tabValue !== 0 && <TableCell>Organization</TableCell>}
              <TableCell>Membership Status</TableCell>
              <TableCell>Active Packages</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tabValue !== 0 ? 7 : 6} align="center">
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const activeMemberships = user.memberships?.filter(
                  m => m.status === 'active' && (!m.endDate || new Date(m.endDate) > new Date())
                ) || [];
                return (
                  <TableRow key={user._id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    {tabValue !== 0 && (
                      <TableCell>
                        {user.organizationName || user.organizationId?.name || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      {activeMemberships.length > 0 || user.organizationName ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="No Active" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.organizationName ? (
                        <Chip label="Organization Package" size="small" color="info" />
                      ) : activeMemberships.length > 0 ? (
                        activeMemberships.map((m, idx) => (
                          <Chip key={idx} label={m.packageId?.name || 'Unknown'} size="small" sx={{ mr: 0.5 }} />
                        ))
                      ) : (
                        'None'
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewDetail(user._id)} color="primary" title="View Details">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDelete(user)} color="error" title="Delete User">
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

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedUser.user?.name || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedUser.user?.email || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Memberships
                </Typography>
                {selectedUser.user?.memberships?.length > 0 ? (
                  selectedUser.user.memberships.map((membership, idx) => (
                    <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography><strong>Package:</strong> {membership.packageId?.name || 'Unknown'}</Typography>
                      <Typography><strong>Status:</strong> {membership.status}</Typography>
                      <Typography><strong>Start:</strong> {new Date(membership.startDate).toLocaleDateString()}</Typography>
                      {membership.endDate && (
                        <Typography><strong>End:</strong> {new Date(membership.endDate).toLocaleDateString()}</Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No memberships</Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Recent Transactions
                </Typography>
                {selectedUser.transactions?.length > 0 ? (
                  selectedUser.transactions.map((tx, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography><strong>Type:</strong> {tx.type}</Typography>
                      <Typography><strong>Amount:</strong> ${tx.amount} {tx.currency}</Typography>
                      <Typography><strong>Status:</strong> {tx.status}</Typography>
                      <Typography><strong>Date:</strong> {new Date(tx.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No transactions</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{userToDelete?.name || userToDelete?.email}</strong>? 
            This action cannot be undone.
            <br />
            <br />
            This will also delete:
            <ul>
              <li>All user memberships</li>
              <li>All user transactions</li>
              {userToDelete?.organizationId && <li>Organization user association</li>}
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

